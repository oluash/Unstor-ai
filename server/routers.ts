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
import { processFeed, crawlNextUrl, seedCrawlQueue } from "./feedIngestion";
import { decodeOduForSituation, queryMedicineKnowledge, groundedOwnerChat } from "./ifaEngine";
import { getDb } from "./db";
import { unstorKnowledgeFeeds, webCrawlQueue, ifaOdu, medicineKnowledge } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
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
        if (!apiKey) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unstor intelligence engine is not configured.",
          });
        }

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

        const kimiMessages = [
          ...input.history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user" as const, content: input.message },
        ];

        const kimiResponse = await kimiChat(kimiMessages, apiKey);

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
  }),

  status: router({
    getActivation: publicProcedure.query(async () => {
      const config = await getOrCreateActivationConfig();
      if (!config) {
        return {
          phase: "LEARNING" as const,
          daysRemaining: 365,
          progressPercent: 0,
          readinessScore: 0,
          personaName: "Unstor",
          personaTagline: "Learning in silence. Evolving in purpose.",
          personaDescription: "",
          learningStartDate: new Date(),
          activationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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
      const activationDate = config?.activationDate ? new Date(config.activationDate) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
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

  // ─── Grounded Owner Chat ──────────────────────────────────────────────────
  groundedChat: router({
    send: adminProcedure
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
