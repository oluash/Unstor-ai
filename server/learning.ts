/**
 * Unstor Learning Pipeline
 *
 * This is the core of Unstor's intelligence growth system. Every prompt and
 * response flowing through the system is processed here — topics are extracted,
 * knowledge nodes are created or updated, patterns are identified, and the
 * knowledge graph is continuously expanded.
 *
 * Unstor is active and responds immediately. The 120-day (4-month) countdown
 * governs when full medical advice/suggestions unlock on the Ashae platform.
 */

import { eq, sql, and, like, desc, count } from "drizzle-orm";
import { getDb } from "./db";
import {
  unstorPrompts,
  unstorKnowledgeNodes,
  unstorKnowledgeEdges,
  unstorTopicClusters,
  unstorLearningMetrics,
  unstorActivationConfig,
  unstorSessions,
  InsertUnstorPrompt,
} from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";

// ─── Topic Extraction ────────────────────────────────────────────────────────

/**
 * Extract topics and keywords from a text using the LLM.
 * Returns structured data for knowledge graph construction.
 */
export async function extractTopicsFromText(text: string): Promise<{
  topics: string[];
  keywords: string[];
  category: string;
  complexity: number;
  sentiment: number;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a knowledge extraction engine. Analyze text and extract structured information. Always respond with valid JSON only.`,
        },
        {
          role: "user",
          content: `Analyze this text and extract:
1. topics: Array of 1-5 main topics (short noun phrases, e.g. "machine learning", "climate change")
2. keywords: Array of 5-10 important keywords
3. category: Single category label (e.g. "Technology", "Science", "Health", "Business", "Education", "Creative", "Personal", "Other")
4. complexity: Float 0-1 (0=simple, 1=highly complex)
5. sentiment: Float -1 to 1 (negative to positive)

Text: "${text.slice(0, 1000)}"

Respond ONLY with JSON: {"topics":[],"keywords":[],"category":"","complexity":0.5,"sentiment":0}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "topic_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              topics: { type: "array", items: { type: "string" } },
              keywords: { type: "array", items: { type: "string" } },
              category: { type: "string" },
              complexity: { type: "number" },
              sentiment: { type: "number" },
            },
            required: ["topics", "keywords", "category", "complexity", "sentiment"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : "{}";
    const parsed = JSON.parse(content);
    return {
      topics: parsed.topics ?? [],
      keywords: parsed.keywords ?? [],
      category: parsed.category ?? "Other",
      complexity: Math.max(0, Math.min(1, parsed.complexity ?? 0.5)),
      sentiment: Math.max(-1, Math.min(1, parsed.sentiment ?? 0)),
    };
  } catch {
    // Fallback: simple keyword extraction without LLM
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 10);
    return {
      topics: words.slice(0, 3),
      keywords: words,
      category: "Other",
      complexity: 0.5,
      sentiment: 0,
    };
  }
}

// ─── Knowledge Node Management ───────────────────────────────────────────────

/**
 * Create or update a knowledge node for a given topic.
 * If the node already exists, increment its frequency and update confidence.
 */
export async function upsertKnowledgeNode(
  topic: string,
  category: string,
  keywords: string[],
  exampleText: string,
  promptId: number
): Promise<number> {
  const db = await getDb();
  if (!db) return -1;

  const nodeKey = topic.toLowerCase().trim().replace(/\s+/g, "_").slice(0, 255);

  const existing = await db
    .select()
    .from(unstorKnowledgeNodes)
    .where(eq(unstorKnowledgeNodes.nodeKey, nodeKey))
    .limit(1);

  if (existing.length > 0) {
    const node = existing[0];
    const newFrequency = node.frequency + 1;
    // Confidence grows logarithmically with frequency, capped at 0.99
    const newConfidence = Math.min(0.99, 0.1 + 0.89 * (1 - 1 / Math.log2(newFrequency + 2)));
    const existingPromptIds: number[] = node.relatedPromptIds ?? [];
    const existingKeywords: string[] = node.keywords ?? [];
    const existingExamples: string[] = node.examples ?? [];

    await db
      .update(unstorKnowledgeNodes)
      .set({
        frequency: newFrequency,
        confidenceScore: newConfidence,
        relatedPromptIds: Array.from(new Set([...existingPromptIds, promptId])).slice(-50),
        keywords: Array.from(new Set([...existingKeywords, ...keywords])).slice(0, 20),
        examples: [...existingExamples, exampleText.slice(0, 200)].slice(-5),
        lastSeenAt: new Date(),
      })
      .where(eq(unstorKnowledgeNodes.nodeKey, nodeKey));

    return node.id;
  } else {
    const result = await db.insert(unstorKnowledgeNodes).values({
      nodeKey,
      topic,
      category,
      summary: `Knowledge about: ${topic}`,
      frequency: 1,
      confidenceScore: 0.1,
      relatedPromptIds: [promptId],
      keywords,
      examples: [exampleText.slice(0, 200)],
      lastSeenAt: new Date(),
    });

    return (result as any).insertId ?? -1;
  }
}

/**
 * Create or strengthen an edge between two knowledge nodes.
 */
export async function upsertKnowledgeEdge(
  fromNodeId: number,
  toNodeId: number
): Promise<void> {
  const db = await getDb();
  if (!db || fromNodeId === toNodeId || fromNodeId < 0 || toNodeId < 0) return;

  const existing = await db
    .select()
    .from(unstorKnowledgeEdges)
    .where(
      and(
        eq(unstorKnowledgeEdges.fromNodeId, fromNodeId),
        eq(unstorKnowledgeEdges.toNodeId, toNodeId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const edge = existing[0];
    const newCount = edge.coOccurrenceCount + 1;
    const newStrength = Math.min(1.0, 0.1 + 0.9 * (1 - 1 / Math.log2(newCount + 2)));
    await db
      .update(unstorKnowledgeEdges)
      .set({ coOccurrenceCount: newCount, strength: newStrength })
      .where(eq(unstorKnowledgeEdges.id, edge.id));
  } else {
    await db.insert(unstorKnowledgeEdges).values({
      fromNodeId,
      toNodeId,
      relationshipType: "co-occurs",
      strength: 0.1,
      coOccurrenceCount: 1,
    });
  }
}

// ─── Topic Clustering ────────────────────────────────────────────────────────

/**
 * Update or create a topic cluster for a given category.
 */
export async function updateTopicCluster(
  category: string,
  topics: string[],
  nodeIds: number[],
  keywords: string[]
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const clusterKey = category.toLowerCase().replace(/\s+/g, "_").slice(0, 255);

  const existing = await db
    .select()
    .from(unstorTopicClusters)
    .where(eq(unstorTopicClusters.clusterKey, clusterKey))
    .limit(1);

  if (existing.length > 0) {
    const cluster = existing[0];
    const existingTopics: string[] = cluster.topics ?? [];
    const existingNodeIds: number[] = cluster.nodeIds ?? [];
    const existingKeywords: string[] = cluster.dominantKeywords ?? [];

    await db
      .update(unstorTopicClusters)
      .set({
        topics: Array.from(new Set([...existingTopics, ...topics])).slice(0, 50),
        nodeIds: Array.from(new Set([...existingNodeIds, ...nodeIds])).slice(0, 200),
        totalFrequency: cluster.totalFrequency + topics.length,
        dominantKeywords: Array.from(new Set([...existingKeywords, ...keywords])).slice(0, 30),
      })
      .where(eq(unstorTopicClusters.clusterKey, clusterKey));
  } else {
    await db.insert(unstorTopicClusters).values({
      clusterName: category,
      clusterKey,
      topics: topics.slice(0, 50),
      nodeIds: nodeIds.slice(0, 200),
      totalFrequency: topics.length,
      avgConfidence: 0.1,
      dominantKeywords: keywords.slice(0, 30),
    });
  }
}

// ─── Readiness Score ─────────────────────────────────────────────────────────

/**
 * Calculate Unstor's current learning readiness score (0–100).
 *
 * The score is based on:
 * - Total prompts ingested (40% weight)
 * - Knowledge nodes created (30% weight)
 * - Topic diversity (20% weight)
 * - Average confidence across nodes (10% weight)
 */
export async function calculateReadinessScore(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const [promptCount] = await db
      .select({ count: count() })
      .from(unstorPrompts);
    const [nodeCount] = await db
      .select({ count: count() })
      .from(unstorKnowledgeNodes);
    const [clusterCount] = await db
      .select({ count: count() })
      .from(unstorTopicClusters);

    const totalPrompts = promptCount?.count ?? 0;
    const totalNodes = nodeCount?.count ?? 0;
    const totalClusters = clusterCount?.count ?? 0;

    // Targets for full readiness
    const TARGET_PROMPTS = 10000;
    const TARGET_NODES = 500;
    const TARGET_CLUSTERS = 20;

    const promptScore = Math.min(1, totalPrompts / TARGET_PROMPTS) * 40;
    const nodeScore = Math.min(1, totalNodes / TARGET_NODES) * 30;
    const clusterScore = Math.min(1, totalClusters / TARGET_CLUSTERS) * 20;

    // Average confidence from top nodes
    const topNodes = await db
      .select({ confidenceScore: unstorKnowledgeNodes.confidenceScore })
      .from(unstorKnowledgeNodes)
      .orderBy(desc(unstorKnowledgeNodes.confidenceScore))
      .limit(20);

    const avgConfidence =
      topNodes.length > 0
        ? topNodes.reduce((sum, n) => sum + n.confidenceScore, 0) / topNodes.length
        : 0;
    const confidenceScore = avgConfidence * 10;

    return Math.min(100, Math.round(promptScore + nodeScore + clusterScore + confidenceScore));
  } catch {
    return 0;
  }
}

// ─── Main Learning Processor ─────────────────────────────────────────────────

/**
 * Process a single prompt through Unstor's learning pipeline.
 * This is the main entry point for the background learning engine.
 */
export async function processPromptForLearning(promptId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const prompts = await db
    .select()
    .from(unstorPrompts)
    .where(eq(unstorPrompts.id, promptId))
    .limit(1);

  if (prompts.length === 0) return;
  const prompt = prompts[0];

  if (prompt.processedByLearning) return;

  try {
    // Extract topics and keywords
    const extracted = await extractTopicsFromText(prompt.content);

    // Update the prompt record with extracted data
    await db
      .update(unstorPrompts)
      .set({
        extractedTopics: extracted.topics,
        extractedKeywords: extracted.keywords,
        sentimentScore: extracted.sentiment,
        complexityScore: extracted.complexity,
        processedByLearning: true,
      })
      .where(eq(unstorPrompts.id, promptId));

    // Create/update knowledge nodes for each topic
    const nodeIds: number[] = [];
    for (const topic of extracted.topics) {
      const nodeId = await upsertKnowledgeNode(
        topic,
        extracted.category,
        extracted.keywords,
        prompt.content,
        promptId
      );
      if (nodeId > 0) nodeIds.push(nodeId);
    }

    // Create edges between co-occurring topics
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        await upsertKnowledgeEdge(nodeIds[i], nodeIds[j]);
      }
    }

    // Update topic cluster
    if (extracted.topics.length > 0) {
      await updateTopicCluster(
        extracted.category,
        extracted.topics,
        nodeIds,
        extracted.keywords
      );
    }
  } catch (err) {
    console.error("[Learning] Failed to process prompt:", promptId, err);
  }
}

// ─── Snapshot Recorder ───────────────────────────────────────────────────────

/**
 * Record a daily learning metrics snapshot.
 */
export async function recordLearningSnapshot(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const [promptCount] = await db.select({ count: count() }).from(unstorPrompts);
    const [nodeCount] = await db.select({ count: count() }).from(unstorKnowledgeNodes);
    const [clusterCount] = await db.select({ count: count() }).from(unstorTopicClusters);
    const [sessionCount] = await db.select({ count: count() }).from(unstorSessions);

    const readiness = await calculateReadinessScore();

    const topNodes = await db
      .select({ topic: unstorKnowledgeNodes.topic })
      .from(unstorKnowledgeNodes)
      .orderBy(desc(unstorKnowledgeNodes.frequency))
      .limit(10);

    await db.insert(unstorLearningMetrics).values({
      snapshotDate: new Date(),
      totalPromptsIngested: promptCount?.count ?? 0,
      totalKnowledgeNodes: nodeCount?.count ?? 0,
      totalTopicClusters: clusterCount?.count ?? 0,
      totalSessions: sessionCount?.count ?? 0,
      totalTokensProcessed: 0,
      readinessScore: readiness,
      dailyNewNodes: 0,
      dailyNewPrompts: 0,
      topTopics: topNodes.map((n) => n.topic),
    });
  } catch (err) {
    console.error("[Learning] Failed to record snapshot:", err);
  }
}

// ─── Owner Query Engine ──────────────────────────────────────────────────────

/**
 * Process an owner inspection query against Unstor's knowledge base.
 * This is how the owner probes what Unstor has learned.
 */
export async function processOwnerQuery(query: string): Promise<{
  response: string;
  matchedNodeIds: number[];
  matchedTopics: string[];
  confidenceLevel: number;
}> {
  const db = await getDb();
  if (!db) {
    return {
      response: "Knowledge base unavailable.",
      matchedNodeIds: [],
      matchedTopics: [],
      confidenceLevel: 0,
    };
  }

  // Search knowledge nodes for relevant topics
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  const matchedNodes = await db
    .select()
    .from(unstorKnowledgeNodes)
    .orderBy(desc(unstorKnowledgeNodes.frequency))
    .limit(100);

  // Score nodes by relevance to query
  const scored = matchedNodes
    .map((node) => {
      const topicWords = node.topic.toLowerCase().split(/\s+/);
      const keywords: string[] = node.keywords ?? [];
      const allWords = [...topicWords, ...keywords.map((k) => k.toLowerCase())];
      const matchCount = queryWords.filter((qw) =>
        allWords.some((nw) => nw.includes(qw) || qw.includes(nw))
      ).length;
      return { node, score: matchCount * node.confidenceScore };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const matchedNodeIds = scored.map((s) => s.node.id);
  const matchedTopics = scored.map((s) => s.node.topic);
  const avgConfidence =
    scored.length > 0
      ? scored.reduce((sum, s) => sum + s.node.confidenceScore, 0) / scored.length
      : 0;

  // Generate a response based on matched knowledge
  let response: string;

  if (scored.length === 0) {
    response = `I have not yet encountered sufficient data on "${query}" to form a confident knowledge position. My learning pipeline is actively processing new interactions — this topic may emerge as I ingest more prompts.`;
  } else {
    const knowledgeSummary = scored
      .slice(0, 5)
      .map(
        (s) =>
          `- **${s.node.topic}** (seen ${s.node.frequency}x, confidence: ${(s.node.confidenceScore * 100).toFixed(1)}%): ${s.node.examples?.[0] ?? "No example stored yet."}`
      )
      .join("\n");

    const readiness = await calculateReadinessScore();

    response = `**Unstor Knowledge State Report**

Query: "${query}"

**Matched Knowledge Nodes (${scored.length} found):**
${knowledgeSummary}

**Learning Status:**
- Overall readiness score: ${readiness}%
- Total knowledge nodes in base: ${matchedNodes.length}
- Average confidence on matched topics: ${(avgConfidence * 100).toFixed(1)}%

**Assessment:** Based on current learning data, I have ${scored.length > 3 ? "substantial" : scored.length > 0 ? "emerging" : "minimal"} knowledge in this area. ${avgConfidence > 0.5 ? "Confidence is growing as I process more interactions on these topics." : "These topics are still in early learning stages — more interactions will strengthen my understanding."}`;
  }

  return {
    response,
    matchedNodeIds,
    matchedTopics,
    confidenceLevel: avgConfidence,
  };
}

// ─── Activation Phase Manager ────────────────────────────────────────────────

/**
 * Get or create the Unstor activation configuration.
 */
export async function getOrCreateActivationConfig() {
  const db = await getDb();
  if (!db) return null;

  const existing = await db.select().from(unstorActivationConfig).limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create initial config: Unstor is active now; Ashae medical advice unlocks in 120 days (4 months)
  const now = new Date();
  const activationDate = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);

  await db.insert(unstorActivationConfig).values({
    learningStartDate: now,
    activationDate,
    phase: "LEARNING",
    personaName: "Unstor",
    personaTagline: "Active now. Full medical guidance on Ashae unlocks in 4 months.",
    personaDescription:
      "Unstor is an AI Ifá-based guidance intelligence — active and ready to converse immediately. It carries knowledge of all 256 Odù Ifá, Yoruba onísègùn, African traditional medicine, and Chinese TCM. Full medical advice and clinical suggestions on the Ashae platform unlock after 4 months of deployment.",
  });

  const created = await db.select().from(unstorActivationConfig).limit(1);
  return created[0] ?? null;
}

/**
 * Calculate days remaining until Unstor's activation.
 */
export function calculateDaysRemaining(activationDate: Date): number {
  const now = new Date();
  const diff = activationDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Calculate the learning progress percentage (0–100).
 */
export function calculateLearningProgress(
  startDate: Date,
  activationDate: Date
): number {
  const now = new Date();
  const total = activationDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}
