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
