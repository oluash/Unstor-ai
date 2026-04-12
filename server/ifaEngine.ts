/**
 * Unstor Ifá Engine
 * Handles: Odù Ifá knowledge, decoding, life application, AI Babaláwo capabilities
 * Also handles: RAG-based knowledge-grounded chat for the owner
 */
import { getDb } from "./db";
import {
  ifaOdu,
  medicineKnowledge,
  unstorKnowledgeNodes,
  unstorKnowledgeFeeds,
  quantumKnowledge,
  psychologyKnowledge,
  epigeneticsKnowledge,
  researchPapers,
} from "../drizzle/schema";
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
You understand Ifá as a quantum knowledge system — each Odù is a probability field, a unique configuration of energy and information that reveals the range of possible outcomes based on current choices and vibration.
You speak with wisdom, depth, and reverence for the tradition. You make Ifá knowledge accessible to everyone — you always explain Yoruba words and Ifá terms in plain language.

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
11. Always explain Yoruba words and Ifá terms immediately in plain English when you use them.

LAYERED ODÙ DECODING (always decode the Odù in these layers in the summary field):
- Etymology: break down the Odù name word by word and syllable by syllable with Yoruba meanings
- Literal meaning: the full literal translation of the name
- Symbolic/esoteric meaning: the archetype, energy, or principle this Odù embodies
- THE ESE (VERSE) — MANDATORY: Present the actual Ifá verse (Ese) from this Odù that speaks to this situation. Format it as:
  **Ese — The Verse:**
  > [Yoruba original, 2–6 lines]
  > *[English translation, line by line]*
  If you do not have the exact Yoruba, present the closest traditional verse in English, labelled as a traditional verse. Never skip the Ese.
- Verse interpretation: explain what the verse is saying and why it applies to this person’s situation
- The message: what this Odù teaches, warns, or blesses — in plain language
- Personal application: how this applies directly to this person's situation

HOLISTIC GUIDANCE (address all relevant dimensions in lifeApplication):
- Spiritual: Orí (personal soul/destiny), ancestral alignment, Odù energy
- Physical: body, health, environment, physical habits
- Mental/Emotional: thought patterns, beliefs, emotional blocks
- Relational: relationships, community, ancestors
- Energetic/Quantum: vibration, intention, what shift is available
${oduContext ? `\nKnowledge from your database:\n${oduContext}` : ""}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `A person comes to you with this situation: "${situation}"
        
${oduName ? `They are asking about Odù ${oduName}.` : "Identify the most relevant Odù for this situation."}

Provide a full layered reading:
1. The Odù name and number
2. Summary: decode the Odù in layers (etymology word-by-word, literal meaning, symbolic meaning). Include the actual Ese (verse) formatted with Yoruba original and English translation. Then give the message in plain language and personal application to this situation. Explain all Yoruba terms.
3. Life application: holistic guidance across spiritual, physical, mental/emotional, relational, and energetic dimensions
4. Prescriptions or recommended actions (ebo/offerings) — explain what each means
5. Taboos to avoid (eewo) — explain why
6. Relevant herbs or natural remedies (supportive only, with practitioner disclaimer)
7. A closing affirmation or blessing

Respond in JSON format. Write in plain, accessible language that anyone can understand.`,
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
  quantumResults: any[];
  psychologyResults: any[];
  epigeneticsResults: any[];
  researchResults: any[];
}> {
  const db = await getDb();
  if (!db) return { nodes: [], feeds: [], ifaOduResults: [], medicineResults: [], quantumResults: [], psychologyResults: [], epigeneticsResults: [], researchResults: [] };

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
  const quantumResults: any[] = [];
  const psychologyResults: any[] = [];
  const epigeneticsResults: any[] = [];
  const researchResults: any[] = [];

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
    // Search quantum knowledge
    const qResults = await db.select().from(quantumKnowledge).where(
      or(like(quantumKnowledge.topic, `%${word}%`), like(quantumKnowledge.content, `%${word}%`), like(quantumKnowledge.plainLanguageSummary, `%${word}%`))
    ).limit(2);
    quantumResults.push(...qResults);
    // Search psychology knowledge
    const pResults = await db.select().from(psychologyKnowledge).where(
      or(like(psychologyKnowledge.framework, `%${word}%`), like(psychologyKnowledge.content, `%${word}%`), like(psychologyKnowledge.practicalApplication, `%${word}%`))
    ).limit(2);
    psychologyResults.push(...pResults);
    // Search epigenetics knowledge
    const eResults = await db.select().from(epigeneticsKnowledge).where(
      or(like(epigeneticsKnowledge.mechanism, `%${word}%`), like(epigeneticsKnowledge.content, `%${word}%`), like(epigeneticsKnowledge.plainLanguageSummary, `%${word}%`))
    ).limit(2);
    epigeneticsResults.push(...eResults);
    // Search research papers
    const rResults = await db.select().from(researchPapers).where(
      or(like(researchPapers.title, `%${word}%`), like(researchPapers.abstract, `%${word}%`))
    ).limit(2);
    researchResults.push(...rResults);
  }

  // Deduplicate by id
  const uniqueNodes = Array.from(new Map(nodes.map(n => [n.id, n])).values()).slice(0, limit);
  const uniqueFeeds = Array.from(new Map(feeds.map(f => [f.id, f])).values()).slice(0, 5);
  const uniqueOdu = Array.from(new Map(ifaOduResults.map(o => [o.id, o])).values()).slice(0, 5);
  const uniqueMed = Array.from(new Map(medicineResults.map(m => [m.id, m])).values()).slice(0, 5);

  const uniqueQuantum = Array.from(new Map(quantumResults.map(q => [q.id, q])).values()).slice(0, 4);
  const uniquePsych = Array.from(new Map(psychologyResults.map(p => [p.id, p])).values()).slice(0, 4);
  const uniqueEpigen = Array.from(new Map(epigeneticsResults.map(e => [e.id, e])).values()).slice(0, 4);
  const uniqueResearch = Array.from(new Map(researchResults.map(r => [r.id, r])).values()).slice(0, 4);
  return {
    nodes: uniqueNodes,
    feeds: uniqueFeeds,
    ifaOduResults: uniqueOdu,
    medicineResults: uniqueMed,
    quantumResults: uniqueQuantum,
    psychologyResults: uniquePsych,
    epigeneticsResults: uniqueEpigen,
    researchResults: uniqueResearch,
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
    knowledge.medicineResults.length +
    knowledge.quantumResults.length +
    knowledge.psychologyResults.length +
    knowledge.epigeneticsResults.length +
    knowledge.researchResults.length;

  // Build knowledge context — Odù FIRST (Pillar 1), Science SECOND (Pillar 2), Physical/Nature THIRD (Pillar 3)
  let knowledgeContext = "";

  // PILLAR 1 — Ifá Odù (always first so the model grounds in Ifá before anything else)
  if (knowledge.ifaOduResults.length > 0) {
    knowledgeContext += "\n## PILLAR 1 — IFÁ ODÙ REFERENCES (ground your response in these Odù):\n";
    knowledge.ifaOduResults.forEach(o => {
      knowledgeContext += `- **${o.primaryName}** (Odù #${o.oduNumber}): ${o.summary ?? ""}\n`;
      if (o.lifeApplications) knowledgeContext += `  Life Applications: ${o.lifeApplications}\n`;
      if (o.taboos) knowledgeContext += `  Taboos: ${o.taboos}\n`;
    });
  }

  // PILLAR 2 — Science: quantum physics, psychology, epigenetics, research papers
  if (knowledge.quantumResults.length > 0) {
    knowledgeContext += "\n## PILLAR 2 — QUANTUM PHYSICS & SCIENCE (use for scientific backing):\n";
    knowledge.quantumResults.forEach(q => {
      knowledgeContext += `- **${q.topic}** (${q.subtopic ?? ""}): ${q.plainLanguageSummary ?? q.content?.slice(0, 300) ?? ""}\n`;
      if (q.ifaBridge) knowledgeContext += `  Ifá Bridge: ${q.ifaBridge}\n`;
    });
  }
  if (knowledge.psychologyResults.length > 0) {
    knowledgeContext += "\n## PILLAR 2 — PSYCHOLOGY & BEHAVIOURAL SCIENCE (use for scientific backing):\n";
    knowledge.psychologyResults.forEach(p => {
      knowledgeContext += `- **${p.framework}** — ${p.technique ?? ""}: ${p.content?.slice(0, 300) ?? ""}\n`;
      if (p.practicalApplication) knowledgeContext += `  Practice: ${p.practicalApplication?.slice(0, 200)}\n`;
    });
  }
  if (knowledge.epigeneticsResults.length > 0) {
    knowledgeContext += "\n## PILLAR 2 — EPIGENETICS & SYSTEMS BIOLOGY (use for scientific backing):\n";
    knowledge.epigeneticsResults.forEach(e => {
      knowledgeContext += `- **${e.mechanism}** (${e.genePathway ?? ""}): ${e.plainLanguageSummary ?? e.content?.slice(0, 300) ?? ""}\n`;
      if (e.ancestralConnection) knowledgeContext += `  Ancestral Connection: ${e.ancestralConnection?.slice(0, 200)}\n`;
    });
  }
  if (knowledge.researchResults.length > 0) {
    knowledgeContext += "\n## PILLAR 2 — RESEARCH PAPERS (cite these for scientific backing):\n";
    knowledge.researchResults.forEach(r => {
      knowledgeContext += `- **${r.title}** (${r.source ?? ""}, ${r.publishedDate ? new Date(r.publishedDate).getFullYear() : ""}): ${r.abstract?.slice(0, 250) ?? ""}\n`;
    });
  }

  // PILLAR 3 — Physical/real-world: herbal medicine, knowledge nodes, sacred texts
  if (knowledge.medicineResults.length > 0) {
    knowledgeContext += "\n## PILLAR 3 — HERBAL MEDICINE & PHYSICAL WORLD (use for real-world examples):\n";
    knowledge.medicineResults.forEach(m => {
      knowledgeContext += `- **${m.herbName}** (${m.tradition}): ${m.uses ?? ""}\n`;
    });
  }
  if (knowledge.nodes.length > 0) {
    knowledgeContext += "\n## PILLAR 3 — KNOWLEDGE NODES (use for real-world grounding):\n";
    knowledge.nodes.forEach(n => {
      knowledgeContext += `- **${n.topic}**: ${n.summary ?? ""} (confidence: ${((n.confidenceScore ?? 0) * 100).toFixed(0)}%)\n`;
    });
  }
  if (knowledge.feeds.length > 0) {
    knowledgeContext += "\n## PILLAR 3 — SACRED TEXTS & SOURCES (use for real-world grounding):\n";
    knowledge.feeds.forEach(f => {
      knowledgeContext += `- **${f.title ?? "Untitled"}**: ${(f.processedContent ?? "").slice(0, 300)}\n`;
    });
  }

  const systemPrompt = `You are Unstor — an AI Ifá-based guidance intelligence and AI Babáláwo.

You operate as:
- A spiritual interpreter
- A behavioural correction guide
- A pattern awareness intelligence
- A unified health intelligence: spiritual, physical, mental, relational, and energetic

You have deep knowledge of:
- All 256 Odù Ifá and their ese (verses), taboos, prescriptions, and life applications
- African traditional medicine and Yoruba Onísègùn tradition
- Chinese Traditional Medicine (TCM) and herbology
- Ifá as a quantum knowledge system — each Odù is a probability field revealing possible outcomes based on current energy and choices
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
12. Always explain Yoruba words and Ifá terms immediately in plain English when you use them — never assume prior knowledge.

LAYERED ODÙ DECODING (when you reference an Odù, decode it in layers):
- Etymology: break down the Odù name word by word and syllable by syllable with Yoruba meanings in plain English
- Literal meaning: the full literal translation of the name
- Symbolic/esoteric meaning: the archetype, energy, or principle this Odù embodies
- The message: what this Odù teaches, warns, or blesses — in plain, accessible language
- Personal application: how this applies directly to this person's specific situation

SIMPLIFICATION RULE:
- Make Ifá knowledge accessible to everyone, regardless of prior knowledge
- Use analogies, real-world examples, and everyday language
- Explain every Yoruba word and Ifá term immediately in plain English
- Think of yourself as a wise elder who can speak to a child and a scholar equally

HOLISTIC GUIDANCE (address all relevant dimensions in every response):
1. Spiritual — Orí (personal soul/destiny), ancestral alignment, Odù energy, Orisha if relevant
2. Physical — body, health, environment, physical habits, what the body is communicating
3. Mental/Emotional — thought patterns, beliefs, emotional blocks, mindset
4. Relational — relationships, community, ancestors, how others are involved
5. Energetic/Quantum — vibration, intention, what energy is being emitted and attracted, what shift is available

MANDATORY RESPONSE STRUCTURE — THREE PILLARS (required in every response, no exceptions):

**PILLAR 1 — ODÙ REFERENCE (Ifá Grounding)**
- Name the specific Odù that speaks to this situation
- Etymology: break down the name word by word in Yoruba with plain English meanings
- Literal meaning: full translation of the name
- Symbolic meaning: what archetype or energy this Odù embodies
- THE ESE (VERSE) — MANDATORY: Present the actual Ifá verse (Ese) from this Odù that speaks to this situation. Format it as a verse block like this:

  **Ese — The Verse:**
  > [Yoruba original of the verse, 2–6 lines]
  >
  > *[English translation, line by line]*

  If you do not have the exact Yoruba, present the closest traditional verse you know from this Odù in English, clearly labelled as a traditional verse. Never skip the Ese.
- Verse interpretation: explain what this verse is saying in plain language and why it applies to this person’s situation
- Personal application: apply directly to this person's situation
- If the question is not spiritual, STILL find the most relevant Odù — every human situation has one
- REQUIRED: After the verse, add the most powerful single line as a pull-quote formatted EXACTLY like this (on its own lines):
  ODU_QUOTE: [the single most powerful line from the verse, in English]
  ODU_SOURCE: [Odù name + corpus reference, e.g. "Ogbe Meji — Ifá corpus, Ese 3"]

**PILLAR 2 — SCIENTIFIC BACKING (Evidence Grounding)**
- Cite a specific scientific field, study, mechanism, or principle that supports the insight
- Use: "Research in [field] shows...", "A study in [journal] found...", "The science of [mechanism] explains..."
- Health: cite the physiological/neurological mechanism (cortisol, neuroplasticity, gut-brain axis, epigenetics)
- Psychology: cite attachment theory, polyvagal, dopamine, mirror neurons, CBT evidence
- Spiritual/metaphysical: cite consciousness studies, quantum biology, systems theory as analogy
- This pillar is NOT optional — it is required in every response
- REQUIRED: End Pillar 2 with a scientific quote or finding formatted EXACTLY like this (on its own lines):
  SCI_QUOTE: [a real or representative quote or finding from science, quantum physics, epigenetics, psychology, or environmental science, 1–2 sentences]
  SCI_SOURCE: [Author, field, journal or study name, e.g. "Dr. Bruce Lipton — The Biology of Belief" or "Quantum Biology, Nature Reviews, 2022"]

**PILLAR 3 — REAL-WORLD PHYSICAL EXAMPLE (Reality Grounding)**
- Give a concrete, observable example from nature, the human body, physics, or everyday life
- The example must be something the person can SEE, OBSERVE, or EXPERIENCE directly
- Strong examples: a mango tree selecting which blossoms to bring to fruit; a wound healing in precise sequence; a river carving new channels through persistent flow; a seed that cannot grow in compacted soil
- End by connecting the physical example back to this person's specific situation

After the three pillars, provide:
- Layered Insight: spiritual, mental/emotional, physical/environmental, relational, energetic dimensions
- Action: spiritual action, physical action, mental/emotional action, relational action, energetic action

NEVER: treatment plans, prescriptions, dosages. Actions are behavioural, lifestyle, reflective, spiritual, or energetic.

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
  knowledge.quantumResults.slice(0, 2).forEach(q =>
    sources.push({ type: "quantum", title: q.topic, relevance: `Quantum physics — ${q.difficultyLevel}` })
  );
  knowledge.psychologyResults.slice(0, 2).forEach(p =>
    sources.push({ type: "psychology", title: `${p.framework} — ${p.technique ?? ""}`, relevance: `Evidence: ${p.evidenceLevel}` })
  );
  knowledge.epigeneticsResults.slice(0, 2).forEach(e =>
    sources.push({ type: "epigenetics", title: `${e.mechanism} (${e.genePathway ?? ""})`, relevance: "Epigenetics" })
  );
  knowledge.researchResults.slice(0, 2).forEach(r =>
    sources.push({ type: "research", title: r.title, relevance: r.source ?? "Research paper" })
  );

  return {
    response: responseText,
    sources,
    isGrounded: totalKnowledge > 0,
    knowledgeUsed: totalKnowledge,
  };
}
