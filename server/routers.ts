import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getOrCreateSession,
  getSessionMessages,
  insertPrompt,
  getKnowledgeNodes,
  getKnowledgeEdges,
  getTopicClusters,
  getLearningMetrics,
  getOwnerQueryHistory,
  saveOwnerQuery,
  getSystemStats,
  getRecentSessions,
} from "./db";
import { kimiChat } from "./kimi";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { processFeed, crawlNextUrl, seedCrawlQueue } from "./feedIngestion";
import { decodeOduForSituation, queryMedicineKnowledge, groundedOwnerChat, retrieveRelevantKnowledge } from "./ifaEngine";
import { getDb } from "./db";
import { unstorKnowledgeFeeds, webCrawlQueue, ifaOdu, medicineKnowledge } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import {
  processPromptForLearning,
  calculateReadinessScore,
  getOrCreateActivationConfig,
  calculateDaysRemaining,
  calculateLearningProgress,
  processOwnerQuery,
  recordLearningSnapshot,
} from "./learning";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Owner access required." });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  chat: router({
    getSession: publicProcedure
      .input(z.object({ sessionKey: z.string() }))
      .query(async ({ input, ctx }) => {
        const session = await getOrCreateSession(
          input.sessionKey,
          ctx.user?.openId,
          ctx.user?.name ?? undefined
        );
        if (!session) return { session: null, messages: [] };
        const messages = await getSessionMessages(session.id);
        return { session, messages };
      }),

    sendMessage: publicProcedure
      .input(
        z.object({
          sessionKey: z.string(),
          message: z.string().min(1).max(8000),
          history: z
            .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
            .default([]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const apiKey = process.env.KIMI_API_KEY;

        const session = await getOrCreateSession(
          input.sessionKey,
          ctx.user?.openId,
          ctx.user?.name ?? undefined
        );
        if (!session) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Session error." });

        const userPromptId = await insertPrompt({
          sessionId: session.id,
          userOpenId: ctx.user?.openId ?? null,
          role: "user",
          content: input.message,
          tokenCount: Math.ceil(input.message.length / 4),
          processedByLearning: false,
        });

        // Retrieve relevant knowledge from all 8 domain tables for grounded response
        const knowledge = await retrieveRelevantKnowledge(input.message, 8);
        let knowledgeContext = "";
        if (knowledge.nodes.length > 0) {
          knowledgeContext += "\n## Knowledge Nodes:\n";
          knowledge.nodes.forEach(n => { knowledgeContext += `- **${n.topic}**: ${n.summary ?? ""}\n`; });
        }
        if (knowledge.ifaOduResults.length > 0) {
          knowledgeContext += "\n## Relevant Ifá Odù:\n";
          knowledge.ifaOduResults.forEach(o => { knowledgeContext += `- **${o.primaryName}** (#${o.oduNumber}): ${o.summary ?? ""}\n`; });
        }
        if (knowledge.medicineResults.length > 0) {
          knowledgeContext += "\n## Herbal Medicine:\n";
          knowledge.medicineResults.forEach(m => { knowledgeContext += `- **${m.herbName}** (${m.tradition}): ${m.uses ?? ""}\n`; });
        }
        if (knowledge.quantumResults.length > 0) {
          knowledgeContext += "\n## Quantum Physics:\n";
          knowledge.quantumResults.forEach(q => { knowledgeContext += `- **${q.topic}**: ${q.plainLanguageSummary ?? q.content?.slice(0, 200) ?? ""}\n`; });
        }
        if (knowledge.psychologyResults.length > 0) {
          knowledgeContext += "\n## Psychology:\n";
          knowledge.psychologyResults.forEach(p => { knowledgeContext += `- **${p.framework}** (${p.technique ?? ""}): ${p.content?.slice(0, 200) ?? ""}\n`; });
        }
        if (knowledge.epigeneticsResults.length > 0) {
          knowledgeContext += "\n## Epigenetics:\n";
          knowledge.epigeneticsResults.forEach(e => { knowledgeContext += `- **${e.mechanism}**: ${e.plainLanguageSummary ?? e.content?.slice(0, 200) ?? ""}\n`; });
        }
        if (knowledge.researchResults.length > 0) {
          knowledgeContext += "\n## Research Papers:\n";
          knowledge.researchResults.forEach(r => { knowledgeContext += `- **${r.title}** (${r.source ?? ""}): ${r.abstract?.slice(0, 200) ?? ""}\n`; });
        }
        if (knowledge.feeds.length > 0) {
          knowledgeContext += "\n## Studied Sources:\n";
          knowledge.feeds.forEach(f => { knowledgeContext += `- **${f.title ?? "Source"}**: ${f.processedContent?.slice(0, 200) ?? ""}\n`; });
        }
        const kimiMessages = [
          ...input.history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user" as const, content: input.message },
        ];

        // Use built-in LLM — always reliable fallback
        const useLLMFallback = async () => {
          const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
          const systemContent = knowledgeContext
            ? `${UNSTOR_SYSTEM_PROMPT}\n\n---\nYOUR CURRENT KNOWLEDGE BASE (use this to ground your response — cite relevant entries):\n${knowledgeContext}`
            : UNSTOR_SYSTEM_PROMPT;
          const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: systemContent },
            ...kimiMessages,
          ];
          const llmResponse = await invokeLLM({ messages: llmMessages });
          const content = llmResponse.choices[0]?.message?.content ?? "I am still learning. Please ask me again soon.";
          return { content: typeof content === "string" ? content : JSON.stringify(content), tokenCount: 0 };
        };

        let kimiResponse: { content: string; tokenCount: number };
        if (apiKey) {
          try {
            kimiResponse = await kimiChat(kimiMessages, apiKey, knowledgeContext);
          } catch (kimiErr: unknown) {
            // Kimi API failed (invalid key, quota, network) — fall back to built-in LLM
            console.warn("[Unstor] Kimi API error, falling back to built-in LLM:", kimiErr instanceof Error ? kimiErr.message : kimiErr);
            kimiResponse = await useLLMFallback();
          }
        } else {
          kimiResponse = await useLLMFallback();
        }

        const assistantPromptId = await insertPrompt({
          sessionId: session.id,
          userOpenId: ctx.user?.openId ?? null,
          role: "assistant",
          content: kimiResponse.content,
          tokenCount: kimiResponse.tokenCount,
          processedByLearning: false,
        });

        if (userPromptId > 0) {
          processPromptForLearning(userPromptId).catch((err) =>
            console.error("[Learning] Error:", err)
          );
        }
        if (assistantPromptId > 0) {
          processPromptForLearning(assistantPromptId).catch((err) =>
            console.error("[Learning] Error:", err)
          );
        }

        return {
          response: kimiResponse.content,
          tokenCount: kimiResponse.tokenCount,
          sessionId: session.id,
        };
      }),

    generateContextImage: publicProcedure
      .input(
        z.object({
          topic: z.string().min(1).max(500),
          oduName: z.string().optional(),
          domain: z.string().optional(),
          paragraphSnippet: z.string().max(400).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const domainStyle = input.domain === "quantum_physics"
            ? "quantum physics visualization, sacred geometry, glowing particles, wave functions"
            : input.domain === "ifa_studies"
            ? "Yoruba If\u00e1 divination, sacred Yoruba symbols, West African spiritual art, cowrie shells"
            : input.domain === "epigenetics"
            ? "DNA double helix, cellular biology, bioluminescent patterns, gene expression"
            : input.domain === "psychology"
            ? "human mind, neural pathways, contemplative meditation, consciousness"
            : "nature, cosmic patterns, sacred wisdom, universal energy";
          const oduRef = input.oduName ? `Inspired by the If\u00e1 Od\u00f9 ${input.oduName}. ` : "";
          const contextSnippet = input.paragraphSnippet
            ? `Supporting this explanation: ${input.paragraphSnippet.slice(0, 300)}. `
            : "";
          const prompt = `Create a culturally respectful, educational, and visually clear image. ${contextSnippet}Topic: ${input.topic}. ${domainStyle}. ${oduRef}Style: realistic, elegant, symbolic where needed, non-cartoonish. Tone: calm, intelligent, spiritually respectful, Afrocentric where appropriate. Deep indigo and violet tones, soft golden light. No text, no words, no letters in the image.`;
          const result = await generateImage({ prompt });
          // Generate a short caption from the topic
          const caption = input.topic.length > 80
            ? input.topic.slice(0, 77) + "..."
            : input.topic;
          return { url: result.url ?? null, caption };
        } catch (err) {
          console.error("[ImageGen] Failed:", err);
          return { url: null, caption: null };
        }
      }),
  }),

  status: router({
    getActivation: publicProcedure.query(async () => {
      const config = await getOrCreateActivationConfig();
      if (!config) {
        return {
          phase: "LEARNING" as const,
          daysRemaining: 120,
          progressPercent: 0,
          readinessScore: 0,
          personaName: "Unstor",
          personaTagline: "Active now. Full medical guidance on Ashae unlocks in 4 months.",
          personaDescription: "",
          learningStartDate: new Date(),
          activationDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        };
      }
      const daysRemaining = calculateDaysRemaining(config.activationDate);
      const progressPercent = calculateLearningProgress(config.learningStartDate, config.activationDate);
      const readinessScore = await calculateReadinessScore();
      return {
        phase: config.phase,
        daysRemaining,
        progressPercent,
        readinessScore,
        personaName: config.personaName,
        personaTagline: config.personaTagline ?? "",
        personaDescription: config.personaDescription ?? "",
        learningStartDate: config.learningStartDate,
        activationDate: config.activationDate,
      };
    }),

    getStats: publicProcedure.query(async () => {
      return getSystemStats();
    }),
  }),

  owner: router({
    query: adminProcedure
      .input(z.object({ query: z.string().min(1).max(2000) }))
      .mutation(async ({ input, ctx }) => {
        const start = Date.now();
        const result = await processOwnerQuery(input.query);
        const processingTimeMs = Date.now() - start;
        await saveOwnerQuery({
          ownerOpenId: ctx.user.openId,
          query: input.query,
          response: result.response,
          matchedNodeIds: result.matchedNodeIds,
          matchedTopics: result.matchedTopics,
          confidenceLevel: result.confidenceLevel,
          processingTimeMs,
        });
        return { ...result, processingTimeMs };
      }),

    getQueryHistory: adminProcedure.query(async () => {
      return getOwnerQueryHistory(30);
    }),

    triggerSnapshot: adminProcedure.mutation(async () => {
      await recordLearningSnapshot();
      return { success: true };
    }),

    checkMilestones: adminProcedure.mutation(async () => {
      const db = await getDb();
      if (!db) return { milestones: [], notified: 0, errors: [] };
      const { milestoneNotifications } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [stats, readiness, config] = await Promise.all([
        getSystemStats(),
        calculateReadinessScore(),
        getOrCreateActivationConfig(),
      ]);
      const score = readiness ?? 0;
      const nodeCount = stats?.totalNodes ?? 0;
      const promptCount = stats?.totalPrompts ?? 0;
      const daysRemaining = config ? calculateDaysRemaining(config.activationDate) : 120;
      // Define all milestone thresholds with unique keys
      const candidates: { key: string; title: string; content: string }[] = [];
      if (score >= 25) candidates.push({ key: "readiness_25", title: "Readiness 25%", content: `Readiness score reached 25% (${score}%)\n\nNodes: ${nodeCount} | Prompts: ${promptCount} | Days to activation: ${daysRemaining}` });
      if (score >= 50) candidates.push({ key: "readiness_50", title: "Readiness 50% — Halfway", content: `Readiness score reached 50% (${score}%) — halfway to activation\n\nNodes: ${nodeCount} | Prompts: ${promptCount} | Days to activation: ${daysRemaining}` });
      if (score >= 75) candidates.push({ key: "readiness_75", title: "Readiness 75% — Approaching Activation", content: `Readiness score reached 75% (${score}%) — approaching activation\n\nNodes: ${nodeCount} | Prompts: ${promptCount} | Days to activation: ${daysRemaining}` });
      if (nodeCount >= 1000) candidates.push({ key: "nodes_1000", title: "1,000 Knowledge Nodes", content: `Knowledge base surpassed 1,000 nodes (${nodeCount} total)\n\nReadiness: ${score}% | Days to activation: ${daysRemaining}` });
      if (nodeCount >= 5000) candidates.push({ key: "nodes_5000", title: "5,000 Knowledge Nodes", content: `Knowledge base surpassed 5,000 nodes (${nodeCount} total)\n\nReadiness: ${score}% | Days to activation: ${daysRemaining}` });
      if (promptCount >= 50000) candidates.push({ key: "prompts_50000", title: "50,000 Prompts Processed", content: `50,000 prompts processed (${promptCount} total)\n\nReadiness: ${score}% | Days to activation: ${daysRemaining}` });
      if (daysRemaining <= 30) candidates.push({ key: "activation_30d", title: "30 Days to Ashae Activation", content: `30 days until Ashae activation — ${daysRemaining} days remaining\n\nReadiness: ${score}%` });
      if (daysRemaining <= 7) candidates.push({ key: "activation_7d", title: "7 Days to Ashae Activation — Final Week", content: `7 days until Ashae activation — final week\n\nReadiness: ${score}%` });
      if (daysRemaining <= 0) candidates.push({ key: "activation_reached", title: "Ashae Activation Window Reached", content: `Ashae activation window reached — readiness: ${score}%\n\nThis is the moment. The system is ready.` });
      // Deduplicate: only notify for milestones not yet recorded
      const existing = await db.select({ milestoneKey: milestoneNotifications.milestoneKey }).from(milestoneNotifications);
      const sentKeys = new Set(existing.map((r) => r.milestoneKey));
      const unsent = candidates.filter((c) => !sentKeys.has(c.key));
      const sent: string[] = [];
      const errors: string[] = [];
      for (const milestone of unsent) {
        const success = await notifyOwner({ title: `Unstor: ${milestone.title}`, content: milestone.content });
        try {
          await db.insert(milestoneNotifications).values({ milestoneKey: milestone.key, title: milestone.title, success: !!success });
          if (success) sent.push(milestone.title);
          else errors.push(`Notification sent but delivery uncertain: ${milestone.title}`);
        } catch {
          errors.push(`Failed to record milestone: ${milestone.title}`);
        }
      }
      return { milestones: sent, notified: sent.length, errors };
    }),
  }),

  knowledge: router({
    getNodes: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return getKnowledgeNodes(input.limit, input.offset);
      }),

    getEdges: adminProcedure.query(async () => {
      return getKnowledgeEdges(200);
    }),

    getClusters: adminProcedure.query(async () => {
      return getTopicClusters();
    }),

    getMetrics: adminProcedure.query(async () => {
      return getLearningMetrics(30);
    }),
  }),

  // ─── Chronos Clinical Feed ───────────────────────────────────────────────────────────────
  // This endpoint receives clinical events from Project Chronos and feeds them
  // directly into Unstor's background learning pipeline.
  chronos: router({
    // Ingest a single clinical event from Chronos into Unstor's learning pipeline
    ingest: publicProcedure
      .input(
        z.object({
          eventType: z.enum(["vitals", "consultation", "lab_result", "patient_registered", "insight_actioned", "kpi_snapshot"]),
          sourceId: z.string().describe("Chronos entity ID (patient ID, consultation ID, etc.)"),
          payload: z.record(z.string(), z.unknown()).describe("Full event payload from Chronos"),
          timestamp: z.string().optional().describe("ISO timestamp of the event"),
        })
      )
      .mutation(async ({ input }) => {
        // Build a structured prompt from the Chronos clinical event
        const eventDescriptions: Record<string, string> = {
          vitals: `Clinical vitals recorded for patient ${input.sourceId}: ${JSON.stringify(input.payload)}`,
          consultation: `Medical consultation completed for patient ${input.sourceId}: ${JSON.stringify(input.payload)}`,
          lab_result: `Laboratory result received for patient ${input.sourceId}: ${JSON.stringify(input.payload)}`,
          patient_registered: `New patient registered in Project Chronos: ${JSON.stringify(input.payload)}`,
          insight_actioned: `AI clinical insight actioned by practitioner for patient ${input.sourceId}: ${JSON.stringify(input.payload)}`,
          kpi_snapshot: `Project Chronos platform KPI snapshot: ${JSON.stringify(input.payload)}`,
        };

        const syntheticPrompt = eventDescriptions[input.eventType] ?? `Chronos event [${input.eventType}]: ${JSON.stringify(input.payload)}`;

        // Insert the synthetic prompt into Unstor's prompt store, then run learning
        // sessionId 1 = reserved Chronos system feed session
        const promptId = await insertPrompt({
          content: syntheticPrompt,
          role: "user",
          sessionId: 1,
          userOpenId: `chronos-${input.eventType}`,
        });
        // Fire-and-forget learning (non-blocking)
        processPromptForLearning(promptId).catch((err) =>
          console.error(`[Unstor] Chronos feed learning error:`, err)
        );

        return {
          success: true,
          message: `Chronos ${input.eventType} event ingested into Unstor learning pipeline`,
          timestamp: new Date().toISOString(),
        };
      }),

    // Batch ingest multiple Chronos events at once
    batchIngest: publicProcedure
      .input(
        z.object({
          events: z.array(
            z.object({
              eventType: z.enum(["vitals", "consultation", "lab_result", "patient_registered", "insight_actioned", "kpi_snapshot"]),
              sourceId: z.string(),
              payload: z.record(z.string(), z.unknown()),
              timestamp: z.string().optional(),
            })
          ).max(100),
        })
      )
      .mutation(async ({ input }) => {
        const results = await Promise.allSettled(
          input.events.map(async (event) => {
            const eventDescriptions: Record<string, string> = {
              vitals: `Clinical vitals for patient ${event.sourceId}: ${JSON.stringify(event.payload)}`,
              consultation: `Consultation for patient ${event.sourceId}: ${JSON.stringify(event.payload)}`,
              lab_result: `Lab result for patient ${event.sourceId}: ${JSON.stringify(event.payload)}`,
              patient_registered: `New patient: ${JSON.stringify(event.payload)}`,
              insight_actioned: `Insight actioned for patient ${event.sourceId}: ${JSON.stringify(event.payload)}`,
              kpi_snapshot: `KPI snapshot: ${JSON.stringify(event.payload)}`,
            };
            const promptText = eventDescriptions[event.eventType] ?? `Chronos ${event.eventType}: ${JSON.stringify(event.payload)}`;
            const pid = await insertPrompt({
              content: promptText,
              role: "user",
              sessionId: 1,
              userOpenId: `chronos-${event.eventType}`,
            });
            processPromptForLearning(pid).catch(() => {});
          })
        );

        const succeeded = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;

        return {
          success: true,
          total: input.events.length,
          succeeded,
          failed,
          timestamp: new Date().toISOString(),
        };
      }),

    // Get the current Unstor learning status (for Chronos to display)
    status: publicProcedure.query(async () => {
      const [stats, readinessScore, config] = await Promise.all([
        getSystemStats(),
        calculateReadinessScore(),
        getOrCreateActivationConfig(),
      ]);
      const now = new Date();
      const learningStart = config?.learningStartDate ? new Date(config.learningStartDate) : now;
      const activationDate = config?.activationDate ? new Date(config.activationDate) : new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);
      const daysUntilActivation = calculateDaysRemaining(activationDate);
      const totalLearningDays = Math.ceil((activationDate.getTime() - learningStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.max(0, totalLearningDays - daysUntilActivation);
      return {
        name: "Unstor",
        version: "1.0.0",
        description: config?.personaDescription ?? "Unstor is the native AI intelligence engine built into Project Chronos.",
        phase: (config?.phase ?? "LEARNING").toLowerCase(),
        readinessScore,
        daysUntilActivation,
        learningDaysElapsed: daysElapsed,
        totalDataPoints: stats?.totalPrompts ?? 0,
        totalInsights: stats?.totalNodes ?? 0,
        isLearning: true,
      };
    }),
  }),

  // ─── Feed Ingestion ───────────────────────────────────────────────────────
  feed: router({
    submit: adminProcedure
      .input(
        z.object({
          feedType: z.enum(["url", "pdf", "text", "book", "data"]),
          title: z.string().optional(),
          sourceUrl: z.string().optional(),
          rawContent: z.string().optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const [result] = await db.insert(unstorKnowledgeFeeds).values({
          feedType: input.feedType,
          title: input.title,
          sourceUrl: input.sourceUrl,
          rawContent: input.rawContent,
          status: "pending",
          chunkCount: 0,
          nodesCreated: 0,
          wordCount: 0,
          tags: input.tags ?? [],
          submittedBy: ctx.user.openId,
        });
        const feedId = (result as any).insertId;
        // Process asynchronously
        processFeed(feedId).catch(console.error);
        return { feedId, message: "Feed submitted — Unstor is learning from it now." };
      }),

    list: adminProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { feeds: [], total: 0 };
        const feeds = await db
          .select()
          .from(unstorKnowledgeFeeds)
          .orderBy(desc(unstorKnowledgeFeeds.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        return { feeds, total: feeds.length };
      }),

    triggerCrawl: adminProcedure.mutation(async () => {
      const crawled = await crawlNextUrl();
      return { crawled, message: crawled ? "Crawled one URL successfully" : "No URLs in queue" };
    }),

    seedCrawlQueue: adminProcedure.mutation(async () => {
      await seedCrawlQueue();
      return { message: "Crawl queue seeded with learning sources" };
    }),

    crawlQueue: adminProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db
          .select()
          .from(webCrawlQueue)
          .orderBy(desc(webCrawlQueue.createdAt))
          .limit(input.limit);
      }),
  }),

  // ─── Ifá & Medicine Knowledge ─────────────────────────────────────────────
  ifa: router({
    decodeOdu: adminProcedure
      .input(z.object({ situation: z.string(), oduName: z.string().optional() }))
      .mutation(async ({ input }) => {
        return decodeOduForSituation(input.situation, input.oduName);
      }),

    listOdu: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(ifaOdu).limit(input.limit).offset(input.offset);
      }),

    searchOdu: adminProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { like, or } = await import("drizzle-orm");
        return db
          .select()
          .from(ifaOdu)
          .where(
            or(
              like(ifaOdu.primaryName, `%${input.query}%`),
              like(ifaOdu.summary, `%${input.query}%`)
            )
          )
          .limit(20);
      }),

    queryMedicine: adminProcedure
      .input(z.object({ query: z.string(), tradition: z.string().optional() }))
      .query(async ({ input }) => {
        return queryMedicineKnowledge(input.query, input.tradition);
      }),

    listMedicine: adminProcedure
      .input(z.object({ tradition: z.string().optional(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        if (input.tradition) {
          const { eq } = await import("drizzle-orm");
          return db
            .select()
            .from(medicineKnowledge)
            .where(eq(medicineKnowledge.tradition, input.tradition as any))
            .limit(input.limit);
        }
        return db.select().from(medicineKnowledge).limit(input.limit);
      }),
  }),

   // ─── Grounded Owner Chat ──────────────────────────────────────────────
  groundedChat: router({
    send: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1).max(4000),
          conversationHistory: z
            .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
            .optional()
            .default([]),
        })
      )
      .mutation(async ({ input }) => {
        return groundedOwnerChat(input.message, input.conversationHistory);
      }),
  }),

  quantum: router({
    list: protectedProcedure
      .input(z.object({ difficulty: z.enum(["introductory", "intermediate", "advanced", "all"]).default("all"), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { quantumKnowledge } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        if (input.difficulty === "all") {
          return db.select().from(quantumKnowledge).limit(input.limit);
        }
        return db.select().from(quantumKnowledge).where(eq(quantumKnowledge.difficultyLevel, input.difficulty)).limit(input.limit);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const { quantumKnowledge } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(quantumKnowledge).where(eq(quantumKnowledge.id, input.id)).limit(1);
        return rows[0] ?? null;
      }),

    search: protectedProcedure
      .input(z.object({ query: z.string(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { quantumKnowledge } = await import("../drizzle/schema");
        const { like, or } = await import("drizzle-orm");
        return db.select().from(quantumKnowledge).where(
          or(
            like(quantumKnowledge.topic, `%${input.query}%`),
            like(quantumKnowledge.content, `%${input.query}%`),
            like(quantumKnowledge.ifaBridge, `%${input.query}%`)
          )
        ).limit(input.limit);
      }),

    getByTopic: protectedProcedure
      .input(z.object({ topic: z.string(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { quantumKnowledge } = await import("../drizzle/schema");
        const { like } = await import("drizzle-orm");
        return db.select().from(quantumKnowledge).where(like(quantumKnowledge.topic, `%${input.topic}%`)).limit(input.limit);
      }),
  }),

  psychology: router({
    list: protectedProcedure
      .input(z.object({ evidenceLevel: z.string().optional(), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { psychologyKnowledge } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        if (input.evidenceLevel) {
          return db.select().from(psychologyKnowledge).where(eq(psychologyKnowledge.evidenceLevel, input.evidenceLevel as "established" | "emerging" | "speculative")).limit(input.limit);
        }
        return db.select().from(psychologyKnowledge).limit(input.limit);
      }),

    search: protectedProcedure
      .input(z.object({ query: z.string(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { psychologyKnowledge } = await import("../drizzle/schema");
        const { like, or } = await import("drizzle-orm");
        return db.select().from(psychologyKnowledge).where(
          or(
            like(psychologyKnowledge.framework, `%${input.query}%`),
            like(psychologyKnowledge.content, `%${input.query}%`),
            like(psychologyKnowledge.practicalApplication, `%${input.query}%`)
          )
        ).limit(input.limit);
      }),
  }),

  epigenetics: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { epigeneticsKnowledge } = await import("../drizzle/schema");
        return db.select().from(epigeneticsKnowledge).limit(input.limit);
      }),

    search: protectedProcedure
      .input(z.object({ query: z.string(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { epigeneticsKnowledge } = await import("../drizzle/schema");
        const { like, or } = await import("drizzle-orm");
        return db.select().from(epigeneticsKnowledge).where(
          or(
            like(epigeneticsKnowledge.genePathway, `%${input.query}%`),
            like(epigeneticsKnowledge.content, `%${input.query}%`),
            like(epigeneticsKnowledge.ancestralConnection, `%${input.query}%`)
          )
        ).limit(input.limit);
      }),
  }),

  research: router({
    triggerArxiv: adminProcedure
      .mutation(async () => {
        const { runArxivJob } = await import("./researchAgent");
        const result = await runArxivJob();
        return { message: `arXiv job complete: ${result.ingested} ingested, ${result.skipped} skipped`, ...result };
      }),

    triggerPubmed: adminProcedure
      .mutation(async () => {
        const { runPubmedJob } = await import("./researchAgent");
        const result = await runPubmedJob();
        return { message: `PubMed job complete: ${result.ingested} ingested, ${result.skipped} skipped`, ...result };
      }),

    getLatest: protectedProcedure
      .input(z.object({ domain: z.string().optional(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { researchPapers } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        if (input.domain) {
          return db.select().from(researchPapers).where(eq(researchPapers.domain, input.domain as any)).orderBy(desc(researchPapers.createdAt)).limit(input.limit);
        }
        return db.select().from(researchPapers).orderBy(desc(researchPapers.createdAt)).limit(input.limit);
      }),

    search: protectedProcedure
      .input(z.object({ query: z.string(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { researchPapers } = await import("../drizzle/schema");
        const { like, or } = await import("drizzle-orm");
        return db.select().from(researchPapers).where(
          or(
            like(researchPapers.title, `%${input.query}%`),
            like(researchPapers.abstract, `%${input.query}%`),
            like(researchPapers.domain, `%${input.query}%`)
          )
        ).limit(input.limit);
      }),
  }),

  user: router({
    updateLearningProfile: protectedProcedure
      .input(z.object({
        learningDepth: z.enum(["introductory", "intermediate", "advanced"]).optional(),
        languagePreference: z.enum(["english", "yoruba", "both"]).optional(),
        domainInterests: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { success: false };
        const { userLearningProfiles } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const existing = await db.select().from(userLearningProfiles).where(eq(userLearningProfiles.userId, ctx.user.id)).limit(1);
        if (existing.length > 0) {
          await db.update(userLearningProfiles).set({
            ...(input.learningDepth && { learningDepth: input.learningDepth }),
            ...(input.languagePreference && { languagePreference: input.languagePreference }),
            ...(input.domainInterests && { domainInterests: input.domainInterests }),
            updatedAt: new Date(),
          }).where(eq(userLearningProfiles.userId, ctx.user.id));
        } else {
          await db.insert(userLearningProfiles).values({
            userId: ctx.user.id,
            userOpenId: ctx.user.openId,
            learningDepth: input.learningDepth ?? "intermediate",
            languagePreference: input.languagePreference ?? "english",
            domainInterests: input.domainInterests ?? [],
          });
        }
        return { success: true };
      }),

    getLearningProfile: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const { userLearningProfiles } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await db.select().from(userLearningProfiles).where(eq(userLearningProfiles.userId, ctx.user.id)).limit(1);
      return rows[0] ?? null;
    }),
  }),

  prompts: router({
    getCategories: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { promptTemplates } = await import("../drizzle/schema");
      const { sql } = await import("drizzle-orm");
      const rows = await db
        .select({
          category: promptTemplates.category,
          categoryLabel: promptTemplates.categoryLabel,
          count: sql<number>`COUNT(*)`
        })
        .from(promptTemplates)
        .groupBy(promptTemplates.category, promptTemplates.categoryLabel);
      return rows;
    }),
    getByCategory: publicProcedure
      .input(z.object({ category: z.string(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { promptTemplates } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return db
          .select()
          .from(promptTemplates)
          .where(eq(promptTemplates.category, input.category))
          .limit(input.limit);
      }),
    getRandom: publicProcedure
      .input(z.object({ count: z.number().default(6), category: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { promptTemplates } = await import("../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");
        const query = db
          .select()
          .from(promptTemplates)
          .orderBy(sql`RAND()`)
          .limit(input.count);
        if (input.category) {
          return db
            .select()
            .from(promptTemplates)
            .where(eq(promptTemplates.category, input.category))
            .orderBy(sql`RAND()`)
            .limit(input.count);
        }
        return query;
      }),
    search: publicProcedure
      .input(z.object({ query: z.string(), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { promptTemplates } = await import("../drizzle/schema");
        const { like, or } = await import("drizzle-orm");
        return db
          .select()
          .from(promptTemplates)
          .where(
            or(
              like(promptTemplates.promptText, `%${input.query}%`),
              like(promptTemplates.categoryLabel, `%${input.query}%`)
            )
          )
          .limit(input.limit);
      }),
  }),
  admin: router({
    getSessions: adminProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return getRecentSessions(input.limit);
      }),

    getDashboard: adminProcedure.query(async () => {
      const [stats, metrics, clusters, recentSessions] = await Promise.all([
        getSystemStats(),
        getLearningMetrics(7),
        getTopicClusters(),
        getRecentSessions(10),
      ]);
      const readiness = await calculateReadinessScore();
      return { stats, metrics, clusters: clusters.slice(0, 10), recentSessions, readiness };
    }),
  }),
});

export type AppRouter = typeof appRouter;
