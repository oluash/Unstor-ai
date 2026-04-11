/**
 * Unstor Research Agent
 * Autonomous ingestion of academic papers from arXiv and PubMed APIs.
 * Runs on a scheduled basis to keep Unstor's knowledge current.
 */
import { getDb } from "./db";
import { researchPapers, webCrawlQueue } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { calculateCredibilityScore, classifyResearchDomain } from "./feedIngestion";

// ─── arXiv API Integration ────────────────────────────────────────────────────

const ARXIV_QUERIES: Array<{ query: string; domain: string; maxResults: number }> = [
  { query: "quantum consciousness observer effect", domain: "quantum_physics", maxResults: 5 },
  { query: "quantum biology photosynthesis", domain: "quantum_physics", maxResults: 5 },
  { query: "quantum entanglement information", domain: "quantum_physics", maxResults: 5 },
  { query: "epigenetics intergenerational trauma", domain: "epigenetics", maxResults: 5 },
  { query: "DNA methylation lifestyle intervention", domain: "epigenetics", maxResults: 5 },
  { query: "mindfulness neuroplasticity brain", domain: "psychology", maxResults: 5 },
  { query: "traditional medicine plant compounds", domain: "alternative_medicine", maxResults: 5 },
];

export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  published: string;
  url: string;
  domain: string;
}

/**
 * Fetch papers from arXiv API for a given query.
 */
export async function fetchArxivPapers(query: string, maxResults: number = 5): Promise<ArxivPaper[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://export.arxiv.org/api/query?search_query=all:${encodedQuery}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Unstor-Research-Agent/1.0" },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) throw new Error(`arXiv API error: ${response.status}`);

    const xml = await response.text();
    const papers: ArxivPaper[] = [];

    // Parse XML entries
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const id = (entry.match(/<id>([^<]+)<\/id>/) ?? [])[1] ?? "";
      const title = (entry.match(/<title>([^<]+)<\/title>/) ?? [])[1]?.trim() ?? "";
      const abstract = (entry.match(/<summary>([\s\S]*?)<\/summary>/) ?? [])[1]?.trim() ?? "";
      const published = (entry.match(/<published>([^<]+)<\/published>/) ?? [])[1] ?? "";
      const authorMatches = Array.from(entry.matchAll(/<name>([^<]+)<\/name>/g));
      const authors = authorMatches.map(m => m[1] ?? "").filter(Boolean);

      if (title && abstract) {
        papers.push({
          id,
          title,
          authors,
          abstract: abstract.slice(0, 2000),
          published,
          url: id.replace("http://arxiv.org/abs/", "https://arxiv.org/abs/"),
          domain: classifyResearchDomain(id + " " + title, abstract),
        });
      }
    }

    return papers;
  } catch (err) {
    console.error(`[arXiv] Failed to fetch "${query}": ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

// ─── PubMed API Integration ───────────────────────────────────────────────────

const PUBMED_QUERIES: Array<{ query: string; domain: string; maxResults: number }> = [
  { query: "epigenetics lifestyle disease prevention", domain: "epigenetics", maxResults: 5 },
  { query: "traditional herbal medicine clinical trial", domain: "alternative_medicine", maxResults: 5 },
  { query: "mindfulness-based stress reduction MBSR", domain: "psychology", maxResults: 5 },
  { query: "intergenerational trauma epigenetic inheritance", domain: "epigenetics", maxResults: 5 },
  { query: "African traditional medicine pharmacology", domain: "alternative_medicine", maxResults: 5 },
  { query: "cognitive behavioral therapy effectiveness", domain: "psychology", maxResults: 5 },
  { query: "integrative medicine cancer complementary", domain: "medical_education", maxResults: 5 },
];

export interface PubmedPaper {
  pmid: string;
  title: string;
  authors: string[];
  abstract: string;
  published: string;
  url: string;
  domain: string;
}

/**
 * Fetch papers from PubMed E-utilities API.
 */
export async function fetchPubmedPapers(query: string, maxResults: number = 5): Promise<PubmedPaper[]> {
  try {
    // Step 1: Search for PMIDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=date&retmode=json`;
    const searchResp = await fetch(searchUrl, {
      headers: { "User-Agent": "Unstor-Research-Agent/1.0" },
      signal: AbortSignal.timeout(20000),
    });

    if (!searchResp.ok) throw new Error(`PubMed search error: ${searchResp.status}`);
    const searchData = await searchResp.json() as any;
    const ids: string[] = searchData?.esearchresult?.idlist ?? [];

    if (!ids.length) return [];

    // Step 2: Fetch summaries
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const summaryResp = await fetch(summaryUrl, {
      headers: { "User-Agent": "Unstor-Research-Agent/1.0" },
      signal: AbortSignal.timeout(20000),
    });

    if (!summaryResp.ok) throw new Error(`PubMed summary error: ${summaryResp.status}`);
    const summaryData = await summaryResp.json() as any;
    const result = summaryData?.result ?? {};

    const papers: PubmedPaper[] = [];
    for (const pmid of ids) {
      const item = result[pmid];
      if (!item) continue;
      const title = item.title ?? "";
      const authors = (item.authors ?? []).map((a: any) => a.name ?? "").filter(Boolean);
      const published = item.pubdate ?? "";
      const abstract = item.title ?? ""; // Summary doesn't include abstract; use title as fallback

      papers.push({
        pmid,
        title,
        authors,
        abstract: abstract.slice(0, 2000),
        published,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        domain: classifyResearchDomain(title, query),
      });
    }

    return papers;
  } catch (err) {
    console.error(`[PubMed] Failed to fetch "${query}": ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

// ─── Ingest Papers into Database ─────────────────────────────────────────────

async function ingestPaperToDb(
  paper: { title: string; authors: string[]; abstract: string; published: string; url: string; domain: string },
  source: "arxiv" | "pubmed"
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Check for duplicate by URL
    const existing = await db
      .select()
      .from(researchPapers)
      .where(eq(researchPapers.url, paper.url))
      .limit(1);

    if (existing.length) return false; // Already ingested

    const credibility = calculateCredibilityScore(paper.url);
    const publishedDate = paper.published ? new Date(paper.published) : new Date();

    await db.insert(researchPapers).values({
      title: paper.title.slice(0, 512),
      authors: paper.authors.slice(0, 20),
      source,
      domain: paper.domain as any,
      abstract: paper.abstract.slice(0, 4000),
      url: paper.url,
      publishedAt: isNaN(publishedDate.getTime()) ? new Date() : publishedDate,
      credibilityScore: credibility / 100, // schema uses 0.0-1.0 float
    });

    // Also add to crawl queue for full text extraction
    const existingCrawl = await db
      .select()
      .from(webCrawlQueue)
      .where(eq(webCrawlQueue.url, paper.url))
      .limit(1);

    if (!existingCrawl.length) {
      await db.insert(webCrawlQueue).values({
        url: paper.url,
        domain: source === "arxiv" ? "arxiv.org" : "pubmed.ncbi.nlm.nih.gov",
        depth: 0,
        priority: 8,
        status: "queued",
        researchDomain: paper.domain as any,
        credibilityScore: credibility,
        sourceAuthority: source === "arxiv" ? "arXiv" : "PubMed/NCBI",
      });
    }

    return true;
  } catch (err) {
    console.error(`[Research Agent] Failed to ingest paper "${paper.title}": ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

// ─── Scheduled Research Digest Job ───────────────────────────────────────────

let lastArxivRun = 0;
let lastPubmedRun = 0;
const ARXIV_INTERVAL_MS = 24 * 60 * 60 * 1000; // daily
const PUBMED_INTERVAL_MS = 24 * 60 * 60 * 1000; // daily

/**
 * Run the arXiv ingestion job (daily).
 * Fetches latest papers for all configured queries.
 */
export async function runArxivJob(): Promise<{ ingested: number; skipped: number }> {
  const now = Date.now();
  if (now - lastArxivRun < ARXIV_INTERVAL_MS && lastArxivRun > 0) {
    return { ingested: 0, skipped: 0 };
  }
  lastArxivRun = now;

  let ingested = 0;
  let skipped = 0;

  console.log("[Research Agent] Starting arXiv daily job...");

  for (const { query, domain, maxResults } of ARXIV_QUERIES) {
    const papers = await fetchArxivPapers(query, maxResults);
    for (const paper of papers) {
      const added = await ingestPaperToDb({ ...paper, domain }, "arxiv");
      if (added) ingested++;
      else skipped++;
    }
    // Rate limit: 1 request per 3 seconds for arXiv
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`[Research Agent] arXiv job complete: ${ingested} ingested, ${skipped} skipped`);
  return { ingested, skipped };
}

/**
 * Run the PubMed ingestion job (daily).
 * Fetches latest papers for all configured queries.
 */
export async function runPubmedJob(): Promise<{ ingested: number; skipped: number }> {
  const now = Date.now();
  if (now - lastPubmedRun < PUBMED_INTERVAL_MS && lastPubmedRun > 0) {
    return { ingested: 0, skipped: 0 };
  }
  lastPubmedRun = now;

  let ingested = 0;
  let skipped = 0;

  console.log("[Research Agent] Starting PubMed daily job...");

  for (const { query, domain, maxResults } of PUBMED_QUERIES) {
    const papers = await fetchPubmedPapers(query, maxResults);
    for (const paper of papers) {
      const added = await ingestPaperToDb({ ...paper, domain }, "pubmed");
      if (added) ingested++;
      else skipped++;
    }
    // Rate limit: 3 requests per second for PubMed E-utilities
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`[Research Agent] PubMed job complete: ${ingested} ingested, ${skipped} skipped`);
  return { ingested, skipped };
}

/**
 * Start the background research agent scheduler.
 * Runs arXiv and PubMed jobs daily.
 */
export function startResearchAgent(): void {
  console.log("[Research Agent] Starting autonomous research agent (arXiv + PubMed)...");

  // Run initial jobs after a 30-second delay (let server warm up)
  setTimeout(async () => {
    try {
      await runArxivJob();
    } catch (err) {
      console.error("[Research Agent] arXiv initial run failed:", err);
    }
  }, 30000);

  setTimeout(async () => {
    try {
      await runPubmedJob();
    } catch (err) {
      console.error("[Research Agent] PubMed initial run failed:", err);
    }
  }, 60000);

  // Schedule daily runs
  setInterval(async () => {
    try {
      await runArxivJob();
    } catch (err) {
      console.error("[Research Agent] arXiv scheduled run failed:", err);
    }
  }, ARXIV_INTERVAL_MS);

  setInterval(async () => {
    try {
      await runPubmedJob();
    } catch (err) {
      console.error("[Research Agent] PubMed scheduled run failed:", err);
    }
  }, PUBMED_INTERVAL_MS);
}
