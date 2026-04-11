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

  it("calculateLearningProgress returns 0 at start", async () => {
    const { calculateLearningProgress } = await import("./learning");
    const now = new Date();
    const future = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const progress = calculateLearningProgress(now, future);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(5); // Should be near 0 at start
  });

  it("calculateLearningProgress returns 100 at end", async () => {
    const { calculateLearningProgress } = await import("./learning");
    const past = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const progress = calculateLearningProgress(past, now);
    expect(progress).toBe(100);
  });
});

// ─── Kimi identity tests ──────────────────────────────────────────────────────

describe("Unstor identity", () => {
  it("UNSTOR_SYSTEM_PROMPT contains Unstor identity", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    // Must assert Unstor's own identity
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Unstor");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("independent");
    // Must contain the rule to never identify as a third-party AI
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Never mention");
    // Must instruct Unstor to use its own identity when asked about its model
    expect(UNSTOR_SYSTEM_PROMPT).toContain("proprietary intelligence architecture");
  });

  it("UNSTOR_SYSTEM_PROMPT instructs to never reveal third-party AI brands", async () => {
    const { UNSTOR_SYSTEM_PROMPT } = await import("./kimi");
    expect(UNSTOR_SYSTEM_PROMPT).toContain("Never mention");
  });
});
