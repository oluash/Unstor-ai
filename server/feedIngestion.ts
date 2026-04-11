/**
 * Unstor Feed Ingestion & Web Crawler Service
 * Handles: URL fetch, raw text, PDF content, autonomous web crawling
 */
import { getDb } from "./db";
import { unstorKnowledgeFeeds, webCrawlQueue, unstorKnowledgeNodes, unstorKnowledgeEdges } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ─── URL Content Fetcher ─────────────────────────────────────────────────────

async function fetchUrlContent(url: string): Promise<{ title: string; text: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Unstor-Learning-Bot/1.0 (AI Knowledge Acquisition System)",
        "Accept": "text/html,application/xhtml+xml,text/plain",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get("content-type") ?? "";
    const rawText = await response.text();

    // Strip HTML tags for basic text extraction
    const text = rawText
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 50000); // cap at 50k chars

    // Extract title
    const titleMatch = rawText.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;

    return { title, text };
  } catch (err) {
    throw new Error(`Failed to fetch ${url}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─── Knowledge Extraction via LLM ────────────────────────────────────────────

async function extractKnowledgeFromText(
  text: string,
  context: string = "general"
): Promise<{ topics: string[]; summary: string; keywords: string[]; chunks: string[] }> {
  const truncated = text.slice(0, 8000);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are Unstor's knowledge extraction engine. Extract structured knowledge from the provided text.
Return JSON with:
- topics: array of main topics (max 10)
- summary: 2-3 sentence summary of the content
- keywords: array of important keywords (max 20)
- chunks: array of 3-5 key knowledge statements extracted verbatim or paraphrased (each max 200 chars)`,
      },
      {
        role: "user",
        content: `Context: ${context}\n\nText to analyse:\n${truncated}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "knowledge_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            topics: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
            chunks: { type: "array", items: { type: "string" } },
          },
          required: ["topics", "summary", "keywords", "chunks"],
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
    return { topics: [], summary: text.slice(0, 200), keywords: [], chunks: [] };
  }
}

// ─── Knowledge Node Creation from Feed ───────────────────────────────────────

async function createNodesFromFeed(
  feedId: number,
  extracted: { topics: string[]; summary: string; keywords: string[]; chunks: string[] }
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  let nodesCreated = 0;

  for (const topic of extracted.topics) {
    const nodeKey = `feed_${feedId}_${topic.toLowerCase().replace(/\s+/g, "_").slice(0, 100)}`;

    // Check if node exists
    const existing = await db
      .select()
      .from(unstorKnowledgeNodes)
      .where(eq(unstorKnowledgeNodes.nodeKey, nodeKey))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(unstorKnowledgeNodes).values({
        nodeKey,
        topic,
        category: "feed_ingested",
        summary: extracted.summary,
        frequency: 1,
        confidenceScore: 0.7,
        relatedPromptIds: [],
        keywords: extracted.keywords.slice(0, 10),
        examples: extracted.chunks.slice(0, 3),
        lastSeenAt: new Date(),
      });
      nodesCreated++;
    } else {
      await db
        .update(unstorKnowledgeNodes)
        .set({
          frequency: (existing[0]!.frequency ?? 0) + 1,
          confidenceScore: Math.min(1.0, (existing[0]!.confidenceScore ?? 0) + 0.05),
          lastSeenAt: new Date(),
        })
        .where(eq(unstorKnowledgeNodes.nodeKey, nodeKey));
    }
  }

  return nodesCreated;
}

// ─── Process a Feed Entry ─────────────────────────────────────────────────────

export async function processFeed(feedId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Mark as processing
  await db
    .update(unstorKnowledgeFeeds)
    .set({ status: "processing" })
    .where(eq(unstorKnowledgeFeeds.id, feedId));

  try {
    const feeds = await db
      .select()
      .from(unstorKnowledgeFeeds)
      .where(eq(unstorKnowledgeFeeds.id, feedId))
      .limit(1);

    if (!feeds.length) throw new Error("Feed not found");
    const feed = feeds[0]!;

    let textContent = feed.rawContent ?? "";
    let title = feed.title ?? "Untitled";

    // Fetch URL content if needed
    if (feed.feedType === "url" && feed.sourceUrl) {
      const fetched = await fetchUrlContent(feed.sourceUrl);
      textContent = fetched.text;
      title = fetched.title;
    }

    if (!textContent || textContent.trim().length < 50) {
      throw new Error("Insufficient content to process");
    }

    const wordCount = textContent.split(/\s+/).length;

    // Extract knowledge
    const extracted = await extractKnowledgeFromText(textContent, title);

    // Create knowledge nodes
    const nodesCreated = await createNodesFromFeed(feedId, extracted);

    // Mark as learned
    await db
      .update(unstorKnowledgeFeeds)
      .set({
        status: "learned",
        processedContent: extracted.summary,
        title,
        chunkCount: extracted.chunks.length,
        nodesCreated,
        wordCount,
        processedAt: new Date(),
      })
      .where(eq(unstorKnowledgeFeeds.id, feedId));

    console.log(`[Unstor Feed] Processed feed ${feedId}: ${nodesCreated} nodes created from "${title}"`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db
      .update(unstorKnowledgeFeeds)
      .set({ status: "failed", errorMessage: msg })
      .where(eq(unstorKnowledgeFeeds.id, feedId));
    console.error(`[Unstor Feed] Failed to process feed ${feedId}: ${msg}`);
  }
}

// ─── Web Crawler ──────────────────────────────────────────────────────────────

export async function crawlNextUrl(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Get next queued URL
  const queued = await db
    .select()
    .from(webCrawlQueue)
    .where(eq(webCrawlQueue.status, "queued"))
    .limit(1);

  if (!queued.length) return false;

  const item = queued[0]!;

  // Mark as crawling
  await db
    .update(webCrawlQueue)
    .set({ status: "crawling" })
    .where(eq(webCrawlQueue.id, item.id));

  try {
    const { title, text } = await fetchUrlContent(item.url);

    // Hash content to detect duplicates
    const hash = text.slice(0, 100).replace(/\s/g, "").slice(0, 64);

    // Extract knowledge
    const extracted = await extractKnowledgeFromText(text, title);

    // Create a feed entry for this crawled page
    const [result] = await db.insert(unstorKnowledgeFeeds).values({
      feedType: "url",
      title,
      sourceUrl: item.url,
      rawContent: text.slice(0, 10000),
      processedContent: extracted.summary,
      status: "learned",
      chunkCount: extracted.chunks.length,
      nodesCreated: 0,
      wordCount: text.split(/\s+/).length,
      tags: extracted.topics.slice(0, 5),
      submittedBy: "web_crawler",
      processedAt: new Date(),
    });

    const feedId = (result as any).insertId ?? 0;
    const nodesCreated = feedId ? await createNodesFromFeed(feedId, extracted) : 0;

    await db
      .update(webCrawlQueue)
      .set({
        status: "done",
        contentHash: hash,
        extractedText: text.slice(0, 5000),
        nodesCreated,
        crawledAt: new Date(),
      })
      .where(eq(webCrawlQueue.id, item.id));

    console.log(`[Unstor Crawler] Crawled ${item.url}: ${nodesCreated} nodes`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db
      .update(webCrawlQueue)
      .set({ status: "failed", errorMessage: msg, crawledAt: new Date() })
      .where(eq(webCrawlQueue.id, item.id));
    console.error(`[Unstor Crawler] Failed ${item.url}: ${msg}`);
    return false;
  }
}

// ─── Seed Web Crawl Queue with Learning Sources ───────────────────────────────

export async function seedCrawlQueue(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const SEED_URLS = [
    // African Traditional Medicine
    { url: "https://en.wikipedia.org/wiki/African_traditional_medicine", domain: "wikipedia.org", priority: 10 },
    { url: "https://en.wikipedia.org/wiki/Yoruba_religion", domain: "wikipedia.org", priority: 10 },
    { url: "https://en.wikipedia.org/wiki/If%C3%A1", domain: "wikipedia.org", priority: 10 },
    { url: "https://en.wikipedia.org/wiki/Babal%C3%A1wo", domain: "wikipedia.org", priority: 10 },
    { url: "https://en.wikipedia.org/wiki/Od%C3%B9_If%C3%A1", domain: "wikipedia.org", priority: 10 },
    // Chinese Traditional Medicine
    { url: "https://en.wikipedia.org/wiki/Traditional_Chinese_medicine", domain: "wikipedia.org", priority: 9 },
    { url: "https://en.wikipedia.org/wiki/Chinese_herbology", domain: "wikipedia.org", priority: 9 },
    { url: "https://en.wikipedia.org/wiki/Acupuncture", domain: "wikipedia.org", priority: 8 },
    // Herbal Medicine
    { url: "https://en.wikipedia.org/wiki/Herbal_medicine", domain: "wikipedia.org", priority: 8 },
    { url: "https://en.wikipedia.org/wiki/Medicinal_plants", domain: "wikipedia.org", priority: 8 },
    // African Health
    { url: "https://en.wikipedia.org/wiki/Health_in_Africa", domain: "wikipedia.org", priority: 7 },
    { url: "https://en.wikipedia.org/wiki/Yoruba_people", domain: "wikipedia.org", priority: 7 },
  ];

  for (const seed of SEED_URLS) {
    // Check if already queued
    const existing = await db
      .select()
      .from(webCrawlQueue)
      .where(eq(webCrawlQueue.domain, seed.domain))
      .limit(100);

    const alreadyQueued = existing.some(e => e.url === seed.url);
    if (!alreadyQueued) {
      await db.insert(webCrawlQueue).values({
        url: seed.url,
        domain: seed.domain,
        depth: 0,
        priority: seed.priority,
        status: "queued",
      });
    }
  }

  console.log("[Unstor Crawler] Seed URLs loaded into crawl queue");
}
