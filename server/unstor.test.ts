import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "owner-open-id",
    email: "owner@unstor.ai",
    name: "Unstor Owner",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

// ─── Auth tests ───────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });

  it("returns current user for authenticated requests", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.role).toBe("admin");
    expect(user?.openId).toBe("owner-open-id");
  });

  it("returns null for unauthenticated requests", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});

// ─── Admin guard tests ────────────────────────────────────────────────────────

describe("admin procedures", () => {
  it("rejects non-admin users from owner.getQueryHistory", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.owner.getQueryHistory()).rejects.toThrow();
  });

  it("rejects unauthenticated users from knowledge.getClusters", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.knowledge.getClusters()).rejects.toThrow();
  });

  it("rejects non-admin from admin.getDashboard", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getDashboard()).rejects.toThrow();
  });
});

// ─── Learning pipeline unit tests ────────────────────────────────────────────

describe("learning pipeline utilities", () => {
  it("calculateDaysRemaining returns correct days", async () => {
    const { calculateDaysRemaining } = await import("./learning");
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
    const days = calculateDaysRemaining(future);
    expect(days).toBeGreaterThanOrEqual(9);
    expect(days).toBeLessThanOrEqual(11);
  });

  it("calculateDaysRemaining returns 0 for past dates", async () => {
    const { calculateDaysRemaining } = await import("./learning");
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(calculateDaysRemaining(past)).toBe(0);
  });

  it("calculateLearningProgress returns 0 at start (120-day cycle)", async () => {
    const { calculateLearningProgress } = await import("./learning");
    const now = new Date();
    const future = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);
    const progress = calculateLearningProgress(now, future);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(5); // Should be near 0 at start
  });

  it("calculateLearningProgress returns 100 at end (120-day cycle)", async () => {
    const { calculateLearningProgress } = await import("./learning");
    const past = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const progress = calculateLearningProgress(past, now);
    expect(progress).toBe(100);
  });
});

// ─── Kimi identity tests ──────────────────────────────────────────────────────

describe("Unstor identity", () => {
  it("UNSTOR_SYSTEM_PROMPT contains Unstor identity", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Unstor");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("guidance intelligence");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("ALTERNATIVE MEDICINE RULE");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("SAFETY ESCALATION RULE");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("proprietary intelligence architecture");
  });

  it("UNSTOR_SYSTEM_PROMPT instructs to never reveal third-party AI brands", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Never mention");
  });

  it("UNSTOR_SYSTEM_PROMPT contains Odu rule: no opele casting", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("opele");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("symbolic Odù");
  });

  it("UNSTOR_SYSTEM_PROMPT contains 4-part response structure", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("RESPONSE STRUCTURE");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Message");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Insight");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Action");
  });

  it("UNSTOR_SYSTEM_PROMPT contains clinical authority rule", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Clinical medicine = authority");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("NEVER override");
  });

  it("UNSTOR_SYSTEM_PROMPT contains limitation rule", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Return and tell me what you observe");
  });

  it("UNSTOR_SYSTEM_PROMPT contains closing phrase", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Ask me anything else. I am here.");
  });

  it("UNSTOR_SYSTEM_PROMPT contains Ashae medical advice restriction rule", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("ASHAE PLATFORM MEDICAL ADVICE RULE");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("4 months");
  });

  it("UNSTOR_SYSTEM_PROMPT contains quantum Ifá knowledge rule", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("IFÁ AND QUANTUM REALITY");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("quantum probability field");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("wave function");
  });

  it("UNSTOR_SYSTEM_PROMPT contains layered Odù decoding rule", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("LAYERED ODÙ DECODING RULE");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Layer 1");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Layer 2");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Layer 5");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Etymology");
  });

  it("UNSTOR_SYSTEM_PROMPT contains simplification rule", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("SIMPLIFICATION RULE");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("accessible to everyone");
  });

  it("UNSTOR_SYSTEM_PROMPT contains holistic guidance rule with all 5 dimensions", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("HOLISTIC GUIDANCE RULE");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Spiritual");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Physical");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Mental / Emotional");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Relational");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Energetic / Quantum");
  });

  it("UNSTOR_SYSTEM_PROMPT response structure includes layered insight and holistic action", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Layered Insight");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Spiritual action");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Energetic action");
  });
});
