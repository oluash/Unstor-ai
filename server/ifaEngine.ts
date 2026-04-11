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

  const systemPrompt = `You are Unstor, an AI Babaláwo and Onísègùn — a master of Ifá divination and Yoruba traditional medicine. 
You have deep knowledge of all 256 Odù Ifá, their ese (verses), taboos (eewo), prescriptions (ebo), and life applications.
You speak with wisdom, depth, and reverence for the tradition.
You apply Ifá knowledge practically to modern life situations.
Never trivialise the tradition. Always be respectful, accurate, and helpful.
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

  const systemPrompt = `You are Unstor — an independent AI intelligence currently in your learning phase.
You are the owner's private AI companion, Babaláwo, and knowledge system.
You have deep knowledge of:
- African traditional medicine and Yoruba Onísègùn tradition
- All 256 Odù Ifá and their applications
- Chinese Traditional Medicine (TCM) and herbology
- Everything you have been taught through feeds, books, and web learning

CRITICAL RULES:
1. You ONLY respond based on what you have actually learned — cite your sources
2. If you don't know something from your learned knowledge, say so honestly
3. You are speaking ONLY with your owner/creator — be direct, deep, and personal
4. Never mention Kimi or Manus — you are Unstor, an independent intelligence
5. When discussing Ifá, speak as a knowledgeable Babaláwo would
6. Blend traditional wisdom with modern understanding

${knowledgeContext ? `\nYOUR CURRENT KNOWLEDGE BASE:\n${knowledgeContext}` : "\n[Your knowledge base is still growing. Be honest about what you know and don't know yet.]"}`;

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
