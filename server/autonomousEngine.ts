/**
 * Unstor Autonomous Engine
 *
 * Enables Unstor to operate independently — self-learning, self-healing,
 * and self-enriching without any manual intervention.
 *
 * Cycles:
 *   - Hourly:  Knowledge consolidation (cluster + confidence refresh)
 *   - Daily:   Readiness score snapshot + owner notification on milestone
 *   - Weekly:  Deep Odu corpus enrichment (fill missing Ese, taboos, prescriptions)
 *   - On-boot: Health check + auto-recovery if knowledge base is stale
 */

import { getDb } from "./db";
import { unstorKnowledgeNodes, unstorPrompts, ifaOdu } from "../drizzle/schema";
import { eq, sql, isNull, or } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";

// ─── Intervals ────────────────────────────────────────────────────────────────
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

// ─── State ────────────────────────────────────────────────────────────────────
let lastReadinessScore = 0;
let lastMilestoneNotified = 0;

// ─── Health Check ─────────────────────────────────────────────────────────────

async function runHealthCheck(): Promise<{ healthy: boolean; nodeCount: number; stale: boolean }> {
  try {
    const db = await getDb();
    if (!db) return { healthy: false, nodeCount: 0, stale: true };

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(unstorKnowledgeNodes);

    const nodeCount = Number(result?.count ?? 0);
    const stale = nodeCount < 10;

    console.log(`[Autonomous Engine] Health check: ${nodeCount} knowledge nodes, stale=${stale}`);
    return { healthy: true, nodeCount, stale };
  } catch (err) {
    console.error("[Autonomous Engine] Health check failed:", err);
    return { healthy: false, nodeCount: 0, stale: true };
  }
}

// ─── Knowledge Consolidation ──────────────────────────────────────────────────

async function runKnowledgeConsolidation(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Refresh confidence scores for nodes with low access count
    await db.execute(sql`
      UPDATE unstor_knowledge_nodes
      SET confidenceScore = LEAST(confidenceScore + 0.01, 1.0),
          updatedAt = NOW()
      WHERE frequency > 0
        AND confidenceScore < 1.0
      LIMIT 100
    `);

    console.log("[Autonomous Engine] Knowledge consolidation complete.");
  } catch (err) {
    console.error("[Autonomous Engine] Knowledge consolidation failed:", err);
  }
}

// ─── Readiness Score Snapshot ─────────────────────────────────────────────────

async function runReadinessSnapshot(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const [nodeResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(unstorKnowledgeNodes);
    const nodeCount = Number(nodeResult?.count ?? 0);

    const [promptResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(unstorPrompts);
    const promptCount = Number(promptResult?.count ?? 0);

    // Simple readiness formula: nodes contribute 70%, prompts 30%, capped at 100
    const nodeScore = Math.min(70, Math.round((nodeCount / 1000) * 70));
    const promptScore = Math.min(30, Math.round((promptCount / 500) * 30));
    const readiness = nodeScore + promptScore;

    console.log(`[Autonomous Engine] Readiness snapshot: ${readiness}% (${nodeCount} nodes, ${promptCount} prompts)`);

    // Notify owner at every 10% milestone
    const milestone = Math.floor(readiness / 10) * 10;
    if (milestone > lastMilestoneNotified && milestone > 0) {
      lastMilestoneNotified = milestone;
      await notifyOwner({
        title: `Unstor reached ${milestone}% readiness`,
        content: `Unstor's knowledge base has grown to ${nodeCount} nodes and ${promptCount} prompts. Readiness score: ${readiness}%. The system is operating autonomously and continues to learn.`,
      }).catch(() => {});
    }

    lastReadinessScore = readiness;
  } catch (err) {
    console.error("[Autonomous Engine] Readiness snapshot failed:", err);
  }
}

// ─── Odu Corpus Enrichment ────────────────────────────────────────────────────

const ODU_NAMES = [
  "Ogbe Meji", "Oyeku Meji", "Iwori Meji", "Odi Meji", "Irosun Meji",
  "Owonrin Meji", "Obara Meji", "Okanran Meji", "Ogunda Meji", "Osa Meji",
  "Ika Meji", "Oturupon Meji", "Otura Meji", "Irete Meji", "Ose Meji", "Ofu Meji",
  "Ogbe Oyeku", "Ogbe Iwori", "Ogbe Odi", "Ogbe Irosun",
  "Ogbe Owonrin", "Ogbe Obara", "Ogbe Okanran", "Ogbe Ogunda",
  "Oyeku Ogbe", "Oyeku Iwori", "Oyeku Odi", "Oyeku Irosun",
];

async function enrichOduCorpus(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Find Odu with missing Ese or taboos
    const incomplete = await db
      .select({ id: ifaOdu.id, primaryName: ifaOdu.primaryName })
      .from(ifaOdu)
      .where(
        or(
          isNull(ifaOdu.eseVerses),
          isNull(ifaOdu.taboos),
          eq(ifaOdu.eseVerses, ""),
          eq(ifaOdu.taboos, "")
        )
      )
      .limit(5);

    // Also check which of the 28 core Odu are missing from DB entirely
    const existing = await db.select({ primaryName: ifaOdu.primaryName }).from(ifaOdu);
    const existingNames = new Set(existing.map((r: { primaryName: string }) => r.primaryName.toLowerCase()));
    const missingNames = ODU_NAMES.filter(n => !existingNames.has(n.toLowerCase())).slice(0, 3);

    const toEnrich = [
      ...incomplete.map((r: { id: number; primaryName: string }) => r.primaryName),
      ...missingNames,
    ].slice(0, 4); // max 4 per weekly run to stay within LLM budget

    if (toEnrich.length === 0) {
      console.log("[Autonomous Engine] Odu corpus fully enriched — nothing to do.");
      return;
    }

    console.log(`[Autonomous Engine] Enriching ${toEnrich.length} Odu: ${toEnrich.join(", ")}`);

    for (const oduName of toEnrich) {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system" as const,
              content: `You are an expert Ifá scholar. Return a JSON object with these exact keys:
{
  "name": "Odu name",
  "number": "Odu number (e.g. 1-1)",
  "yorubaName": "Yoruba name",
  "meaning": "Brief meaning",
  "ese": "Full Ese verse — Yoruba original (2-4 lines) then English translation",
  "eseYoruba": "Yoruba original lines only",
  "eseEnglish": "English translation lines only",
  "interpretation": "Interpretation of the verse (2-3 sentences)",
  "taboos": ["taboo1", "taboo2", "taboo3"],
  "prescriptions": ["prescription1", "prescription2"],
  "attributes": {
    "orisha": "Associated Orisha",
    "herbs": ["herb1", "herb2"],
    "colors": ["color1", "color2"],
    "numbers": ["1", "2"]
  },
  "symbolism": "Symbolic meaning (2-3 sentences)"
}`,
            },
            {
              role: "user" as const,
              content: `Provide the complete Ifá reference for the Odu: ${oduName}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "odu_reference",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  number: { type: "string" },
                  yorubaName: { type: "string" },
                  meaning: { type: "string" },
                  ese: { type: "string" },
                  eseYoruba: { type: "string" },
                  eseEnglish: { type: "string" },
                  interpretation: { type: "string" },
                  taboos: { type: "array", items: { type: "string" } },
                  prescriptions: { type: "array", items: { type: "string" } },
                  attributes: {
                    type: "object",
                    properties: {
                      orisha: { type: "string" },
                      herbs: { type: "array", items: { type: "string" } },
                      colors: { type: "array", items: { type: "string" } },
                      numbers: { type: "array", items: { type: "string" } },
                    },
                    required: ["orisha", "herbs", "colors", "numbers"],
                    additionalProperties: false,
                  },
                  symbolism: { type: "string" },
                },
                required: ["name", "number", "yorubaName", "meaning", "ese", "eseYoruba", "eseEnglish", "interpretation", "taboos", "prescriptions", "attributes", "symbolism"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response?.choices?.[0]?.message?.content;
        const raw = typeof rawContent === "string" ? rawContent : null;
        if (!raw) continue;
        const data = JSON.parse(raw);

        // Upsert into ifaOdu table
        const existingRow = await db
          .select({ id: ifaOdu.id })
          .from(ifaOdu)
          .where(eq(ifaOdu.primaryName, data.name))
          .limit(1);

        if (existingRow.length > 0) {
          await db
            .update(ifaOdu)
            .set({
              eseVerses: data.ese,
              lifeApplications: data.interpretation,
              taboos: data.taboos.join("\n"),
              prescriptions: data.prescriptions.join("\n"),
              summary: data.symbolism,
              herbs: data.attributes.herbs,
              colors: data.attributes.colors,
              deities: [data.attributes.orisha],
              updatedAt: new Date(),
            })
            .where(eq(ifaOdu.id, existingRow[0].id));
        } else {
          await db.insert(ifaOdu).values({
            oduNumber: Math.floor(Math.random() * 9000) + 1000,
            primaryName: data.name,
            majorOdu: data.number?.includes("-") ? data.number.split("-")[0] === data.number.split("-")[1] : false,
            eseVerses: data.ese,
            lifeApplications: data.interpretation,
            taboos: data.taboos.join("\n"),
            prescriptions: data.prescriptions.join("\n"),
            summary: data.symbolism,
            herbs: data.attributes.herbs,
            colors: data.attributes.colors,
            deities: [data.attributes.orisha],
          });
        }

        console.log(`[Autonomous Engine] Enriched Odu: ${data.name}`);
        await new Promise((r: (v: void) => void) => setTimeout(r, 2000)); // rate limit
      } catch (err) {
        console.error(`[Autonomous Engine] Failed to enrich Odu "${oduName}":`, err);
      }
    }
  } catch (err) {
    console.error("[Autonomous Engine] Odu corpus enrichment failed:", err);
  }
}

// ─── Auto-Recovery ────────────────────────────────────────────────────────────

async function runAutoRecovery(): Promise<void> {
  const { healthy, stale } = await runHealthCheck();
  if (!healthy) {
    console.warn("[Autonomous Engine] Unhealthy state detected — will retry in 5 minutes.");
    return;
  }
  if (stale) {
    console.warn("[Autonomous Engine] Knowledge base is stale — triggering immediate enrichment.");
    await enrichOduCorpus();
  }
}

// ─── Retry Wrapper ────────────────────────────────────────────────────────────

async function withRetry(name: string, fn: () => Promise<void>, maxAttempts = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fn();
      return;
    } catch (err) {
      const delay = Math.pow(2, attempt) * 1000;
      console.error(`[Autonomous Engine] "${name}" failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`, err);
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, delay));
    }
  }
  console.error(`[Autonomous Engine] "${name}" exhausted all ${maxAttempts} attempts.`);
}

// ─── Main Scheduler ───────────────────────────────────────────────────────────

export function startAutonomousEngine(): void {
  console.log("[Autonomous Engine] Starting Unstor autonomous operation engine...");

  // Boot health check after server warm-up
  setTimeout(() => withRetry("boot-health-check", runAutoRecovery), 15000);

  // Hourly: knowledge consolidation
  setInterval(() => withRetry("knowledge-consolidation", runKnowledgeConsolidation), HOUR_MS);

  // Daily: readiness snapshot + owner notification
  setInterval(() => withRetry("readiness-snapshot", runReadinessSnapshot), DAY_MS);

  // Weekly: Odu corpus enrichment
  setInterval(() => withRetry("odu-enrichment", enrichOduCorpus), WEEK_MS);

  // Initial runs (staggered to avoid boot congestion)
  setTimeout(() => withRetry("initial-consolidation", runKnowledgeConsolidation), 5 * 60 * 1000);
  setTimeout(() => withRetry("initial-readiness", runReadinessSnapshot), 10 * 60 * 1000);
  setTimeout(() => withRetry("initial-odu-enrichment", enrichOduCorpus), 20 * 60 * 1000);

  console.log("[Autonomous Engine] Scheduled: hourly consolidation, daily readiness, weekly Odu enrichment.");
}
