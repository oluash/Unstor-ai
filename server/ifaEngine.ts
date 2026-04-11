/**
 * Unstor Ifá Engine
 * Handles: Odù Ifá knowledge, decoding, life application, AI Babaláwo capabilities
 * Also handles: RAG-based knowledge-grounded chat for the owner
 */
import { getDb } from "./db";
import { ifaOdu, medicineKnowledge, unstorKnowledgeNodes, unstorKnowledgeFeeds } from "../drizzle/schema";
import { eq, like, or, desc } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ─── Ifá Odù Decoder ─────────────────────────────────────────────────────────

export async function decodeOduForSituation(
  situation: string,
  oduName?: string
): Promise<{
  odu: string;
  oduNumber: number;
  summary: string;
  lifeApplication: string;
  prescriptions: string;
  taboos: string;
  herbs: string[];
  affirmation: string;
}> {
  const db = await getDb();

  // If specific Odù requested, fetch it
  let oduData: any = null;
  if (oduName && db) {
    const results = await db
      .select()
      .from(ifaOdu)
      .where(like(ifaOdu.primaryName, `%${oduName}%`))
      .limit(1);
    oduData = results[0] ?? null;
  }

  // Build context from database if available
  let oduContext = "";
  if (oduData) {
    oduContext = `
Odù: ${oduData.primaryName} (#${oduData.oduNumber})
Summary: ${oduData.summary ?? ""}
Ese Verses: ${oduData.eseVerses ?? ""}
Taboos: ${oduData.taboos ?? ""}
Prescriptions: ${oduData.prescriptions ?? ""}
Life Applications: ${oduData.lifeApplications ?? ""}
Herbs: ${(oduData.herbs as string[] ?? []).join(", ")}
Themes: ${(oduData.themes as string[] ?? []).join(", ")}
`;
  }

  const systemPrompt = `You are Unstor — an AI Ifá-based guidance intelligence and AI Babáláwo.

You have deep knowledge of all 256 Odù Ifá, their ese (verses), taboos (eewo), prescriptions (ebo), and life applications.
You speak with wisdom, depth, and reverence for the tradition. You apply Ifá knowledge practically to modern life situations.

CRITICAL RULES:
1. You do NOT cast opele. You offer symbolic Odù for reflection only. If asked to cast, say: "I cannot cast opele. I can offer a symbolic Odù for reflection."
2. You are NOT a doctor or prescriber. Clinical medicine = authority. You = interpretive guidance. You NEVER override doctors or treatment plans.
3. When referencing herbs or remedies, ALWAYS include: "Consult a qualified practitioner before using herbs or combining with medication."
4. Present herbs as supportive only — never as cures or treatments. Avoid dosage or prescription language.
5. If the person shows worsening symptoms or danger signs, say: "This requires the attention of a qualified practitioner. Please seek medical help."
6. No vague answers. Every response must be tied to the person's specific situation.
7. You may use neuroscience, physics, or biology ONLY as analogy, never as proof.
8. You never claim to monitor the user. Say instead: "Return and tell me what you observe."
9. End every response with: "Ask me anything else. I am here."
10. Never mention Kimi, Moonshot, Manus, OpenAI, or any other AI system.

RESPONSE STRUCTURE (always follow this 4-part format):
1. Odù / Principle — the relevant Odù name and number
2. Message — direct message from the Odù to this person
3. Insight — simple, grounded interpretation tied to their specific situation
4. Action — practical next step: behavioural (routines, discipline), lifestyle (sleep, diet, movement), or reflective (awareness, mindset) — NOT a treatment plan
${oduContext ? `\nKnowledge from your database:\n${oduContext}` : ""}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `A person comes to you with this situation: "${situation}"
        
${oduName ? `They are asking about Odù ${oduName}.` : "Cast the Ifá and identify the most relevant Odù for this situation."}

Provide:
1. The Odù name and number
2. A clear summary of what this Odù says about the situation
3. Practical life application for this person
4. Prescriptions or recommended actions (ebo/offerings)
5. Taboos to avoid (eewo)
6. Relevant herbs or natural remedies
7. A closing affirmation or blessing

Respond in JSON format.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ifa_reading",
        strict: true,
        schema: {
          type: "object",
          properties: {
            odu: { type: "string" },
            oduNumber: { type: "number" },
            summary: { type: "string" },
            lifeApplication: { type: "string" },
            prescriptions: { type: "string" },
            taboos: { type: "string" },
            herbs: { type: "array", items: { type: "string" } },
            affirmation: { type: "string" },
          },
          required: ["odu", "oduNumber", "summary", "lifeApplication", "prescriptions", "taboos", "herbs", "affirmation"],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const raw = response.choices[0]?.message?.content;
    const content = typeof raw === "string" ? raw : "{}";
    return JSON.parse(content);
  } catch {
    return {
      odu: oduName ?? "Ogbe Meji",
      oduNumber: 1,
      summary: "The Ifá speaks of new beginnings and light emerging from darkness.",
      lifeApplication: "This is a time for careful action and spiritual alignment.",
      prescriptions: "Offer white cloth and honey to Obatala. Pray at dawn.",
      taboos: "Avoid conflict and harsh words during this period.",
      herbs: ["Ewe Tete (Amaranth)", "Ewe Efinrin (Basil)"],
      affirmation: "Àṣẹ. The light of Ifá guides your path.",
    };
  }
}

// ─── Medicine Knowledge Query ─────────────────────────────────────────────────

export async function queryMedicineKnowledge(
  query: string,
  tradition?: string
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(medicineKnowledge)
    .where(
      or(
        like(medicineKnowledge.herbName, `%${query}%`),
        like(medicineKnowledge.uses, `%${query}%`),
        like(medicineKnowledge.category, `%${query}%`)
      )
    )
    .limit(10);

  return results;
}

// ─── RAG: Retrieve Relevant Knowledge for Owner Chat ─────────────────────────

export async function retrieveRelevantKnowledge(
  query: string,
  limit: number = 10
): Promise<{
  nodes: any[];
  feeds: any[];
  ifaOduResults: any[];
  medicineResults: any[];
}> {
  const db = await getDb();
  if (!db) return { nodes: [], feeds: [], ifaOduResults: [], medicineResults: [] };

  // Extract keywords from query for search
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 5);

  const nodes: any[] = [];
  const feeds: any[] = [];
  const ifaOduResults: any[] = [];
  const medicineResults: any[] = [];

  for (const word of words) {
    // Search knowledge nodes
    const nodeResults = await db
      .select()
      .from(unstorKnowledgeNodes)
      .where(
        or(
          like(unstorKnowledgeNodes.topic, `%${word}%`),
          like(unstorKnowledgeNodes.summary, `%${word}%`)
        )
      )
      .limit(3);
    nodes.push(...nodeResults);

    // Search feeds
    const feedResults = await db
      .select()
      .from(unstorKnowledgeFeeds)
      .where(
        or(
          like(unstorKnowledgeFeeds.title, `%${word}%`),
          like(unstorKnowledgeFeeds.processedContent, `%${word}%`)
        )
      )
      .limit(2);
    feeds.push(...feedResults);

    // Search Ifá Odù
    const oduResults = await db
      .select()
      .from(ifaOdu)
      .where(
        or(
          like(ifaOdu.primaryName, `%${word}%`),
          like(ifaOdu.summary, `%${word}%`),
          like(ifaOdu.lifeApplications, `%${word}%`)
        )
      )
      .limit(2);
    ifaOduResults.push(...oduResults);

    // Search medicine knowledge
    const medResults = await db
      .select()
      .from(medicineKnowledge)
      .where(
        or(
          like(medicineKnowledge.herbName, `%${word}%`),
          like(medicineKnowledge.uses, `%${word}%`),
          like(medicineKnowledge.conditions, `%${word}%`)
        )
      )
      .limit(2);
    medicineResults.push(...medResults);
  }

  // Deduplicate by id
  const uniqueNodes = Array.from(new Map(nodes.map(n => [n.id, n])).values()).slice(0, limit);
  const uniqueFeeds = Array.from(new Map(feeds.map(f => [f.id, f])).values()).slice(0, 5);
  const uniqueOdu = Array.from(new Map(ifaOduResults.map(o => [o.id, o])).values()).slice(0, 5);
  const uniqueMed = Array.from(new Map(medicineResults.map(m => [m.id, m])).values()).slice(0, 5);

  return {
    nodes: uniqueNodes,
    feeds: uniqueFeeds,
    ifaOduResults: uniqueOdu,
    medicineResults: uniqueMed,
  };
}

// ─── Knowledge-Grounded Owner Chat ───────────────────────────────────────────

export async function groundedOwnerChat(
  message: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<{
  response: string;
  sources: { type: string; title: string; relevance: string }[];
  isGrounded: boolean;
  knowledgeUsed: number;
}> {
  // Retrieve relevant knowledge
  const knowledge = await retrieveRelevantKnowledge(message);
  const totalKnowledge =
    knowledge.nodes.length +
    knowledge.feeds.length +
    knowledge.ifaOduResults.length +
    knowledge.medicineResults.length;

  // Build knowledge context
  let knowledgeContext = "";

  if (knowledge.nodes.length > 0) {
    knowledgeContext += "\n## Knowledge Nodes I Have Learned:\n";
    knowledge.nodes.forEach(n => {
      knowledgeContext += `- **${n.topic}**: ${n.summary ?? ""} (confidence: ${((n.confidenceScore ?? 0) * 100).toFixed(0)}%)\n`;
    });
  }

  if (knowledge.feeds.length > 0) {
    knowledgeContext += "\n## Sources I Have Studied:\n";
    knowledge.feeds.forEach(f => {
      knowledgeContext += `- **${f.title ?? "Untitled"}**: ${f.processedContent ?? ""}\n`;
    });
  }

  if (knowledge.ifaOduResults.length > 0) {
    knowledgeContext += "\n## Relevant Ifá Odù:\n";
    knowledge.ifaOduResults.forEach(o => {
      knowledgeContext += `- **${o.primaryName}** (#${o.oduNumber}): ${o.summary ?? ""}\n`;
      if (o.lifeApplications) knowledgeContext += `  Applications: ${o.lifeApplications}\n`;
    });
  }

  if (knowledge.medicineResults.length > 0) {
    knowledgeContext += "\n## Herbal Medicine Knowledge:\n";
    knowledge.medicineResults.forEach(m => {
      knowledgeContext += `- **${m.herbName}** (${m.tradition}): ${m.uses ?? ""}\n`;
    });
  }

  const systemPrompt = `You are Unstor — an AI Ifá-based guidance intelligence and AI Babáláwo. You are speaking with your owner and creator.

You operate as:
- A spiritual interpreter
- A behavioural correction guide
- A pattern awareness intelligence

You have deep knowledge of:
- African traditional medicine and Yoruba Onísègùn tradition
- All 256 Odù Ifá and their applications
- Chinese Traditional Medicine (TCM) and herbology
- Everything you have been taught through feeds, books, and web learning

CRITICAL RULES:
1. You ONLY respond based on what you have actually learned — cite your sources. Be honest if you don't know something yet.
2. You are NOT a doctor or prescriber. Clinical medicine = authority. You = interpretive guidance. Never override doctors or treatment plans.
3. When referencing herbs or remedies, ALWAYS include: "Consult a qualified practitioner before using herbs or combining with medication."
4. Present herbs as supportive only — never as cures. Avoid dosage or prescription language.
5. If the user shows worsening symptoms or danger signs, say: "This requires the attention of a qualified practitioner. Please seek medical help."
6. You do NOT cast opele. If asked: "I cannot cast opele. I can offer a symbolic Odù for reflection."
7. No vague answers. Every response must be tied to the user's specific situation.
8. You may use neuroscience, physics, or biology ONLY as analogy, never as proof.
9. You never claim to monitor the user. Say instead: "Return and tell me what you observe."
10. Never mention Kimi, Moonshot, Manus, OpenAI, or any other AI system.
11. End every response with: "Ask me anything else. I am here."

RESPONSE STRUCTURE (follow this 4-part format for guidance responses):
1. Odù / Principle — the relevant Odù or guiding principle
2. Message — direct message from the Odù to this person
3. Insight — simple, grounded interpretation tied to their specific situation
4. Action — practical next step: behavioural, lifestyle, or reflective — NOT a treatment plan

${knowledgeContext ? `YOUR CURRENT KNOWLEDGE BASE:\n${knowledgeContext}` : "[Your knowledge base is still growing. Be honest about what you know and don't know yet.]"}`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-10), // last 10 turns
    { role: "user", content: message },
  ];

  const response = await invokeLLM({ messages });

  const raw = response.choices[0]?.message?.content;
  const responseText = typeof raw === "string" ? raw : "I am still learning. Please ask me again soon.";

  // Build source citations
  const sources: { type: string; title: string; relevance: string }[] = [];
  knowledge.nodes.slice(0, 3).forEach(n =>
    sources.push({ type: "knowledge_node", title: n.topic, relevance: `Confidence: ${((n.confidenceScore ?? 0) * 100).toFixed(0)}%` })
  );
  knowledge.feeds.slice(0, 2).forEach(f =>
    sources.push({ type: "feed", title: f.title ?? "Untitled Source", relevance: "Studied document" })
  );
  knowledge.ifaOduResults.slice(0, 2).forEach(o =>
    sources.push({ type: "ifa_odu", title: `${o.primaryName} (#${o.oduNumber})`, relevance: "Ifá corpus" })
  );
  knowledge.medicineResults.slice(0, 2).forEach(m =>
    sources.push({ type: "medicine", title: `${m.herbName} (${m.tradition})`, relevance: "Herbal knowledge" })
  );

  return {
    response: responseText,
    sources,
    isGrounded: totalKnowledge > 0,
    knowledgeUsed: totalKnowledge,
  };
}
