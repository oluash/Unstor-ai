import { eq, desc, count, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  unstorSessions,
  unstorPrompts,
  unstorKnowledgeNodes,
  unstorKnowledgeEdges,
  unstorTopicClusters,
  unstorLearningMetrics,
  unstorOwnerQueries,
  InsertUnstorPrompt,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Session Helpers ─────────────────────────────────────────────────────────

export async function getOrCreateSession(
  sessionKey: string,
  userOpenId?: string,
  userName?: string
) {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(unstorSessions)
    .where(eq(unstorSessions.sessionKey, sessionKey))
    .limit(1);

  if (existing.length > 0) return existing[0];

  await db.insert(unstorSessions).values({
    sessionKey,
    userOpenId: userOpenId ?? null,
    userName: userName ?? null,
    totalMessages: 0,
    totalTokensIngested: 0,
  });

  const created = await db
    .select()
    .from(unstorSessions)
    .where(eq(unstorSessions.sessionKey, sessionKey))
    .limit(1);

  return created[0] ?? null;
}

export async function getSessionMessages(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(unstorPrompts)
    .where(eq(unstorPrompts.sessionId, sessionId))
    .orderBy(unstorPrompts.createdAt);
}

// ─── Prompt Helpers ───────────────────────────────────────────────────────────

export async function insertPrompt(data: InsertUnstorPrompt): Promise<number> {
  const db = await getDb();
  if (!db) return -1;
  const result = await db.insert(unstorPrompts).values(data);
  return (result as any).insertId ?? -1;
}

// ─── Knowledge Base Helpers ───────────────────────────────────────────────────

export async function getKnowledgeNodes(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(unstorKnowledgeNodes)
    .orderBy(desc(unstorKnowledgeNodes.frequency))
    .limit(limit)
    .offset(offset);
}

export async function getKnowledgeEdges(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(unstorKnowledgeEdges)
    .orderBy(desc(unstorKnowledgeEdges.strength))
    .limit(limit);
}

export async function getTopicClusters() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(unstorTopicClusters)
    .orderBy(desc(unstorTopicClusters.totalFrequency));
}

export async function getLearningMetrics(limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(unstorLearningMetrics)
    .orderBy(desc(unstorLearningMetrics.snapshotDate))
    .limit(limit);
}

export async function getOwnerQueryHistory(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(unstorOwnerQueries)
    .orderBy(desc(unstorOwnerQueries.createdAt))
    .limit(limit);
}

export async function saveOwnerQuery(data: {
  ownerOpenId: string;
  query: string;
  response: string;
  matchedNodeIds: number[];
  matchedTopics: string[];
  confidenceLevel: number;
  processingTimeMs: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(unstorOwnerQueries).values(data);
}

export async function getSystemStats() {
  const db = await getDb();
  if (!db) return null;

  const [promptCount] = await db.select({ count: count() }).from(unstorPrompts);
  const [nodeCount] = await db.select({ count: count() }).from(unstorKnowledgeNodes);
  const [clusterCount] = await db.select({ count: count() }).from(unstorTopicClusters);
  const [sessionCount] = await db.select({ count: count() }).from(unstorSessions);
  const [userCount] = await db.select({ count: count() }).from(users);

  return {
    totalPrompts: promptCount?.count ?? 0,
    totalNodes: nodeCount?.count ?? 0,
    totalClusters: clusterCount?.count ?? 0,
    totalSessions: sessionCount?.count ?? 0,
    totalUsers: userCount?.count ?? 0,
  };
}

export async function getRecentSessions(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(unstorSessions)
    .orderBy(desc(unstorSessions.updatedAt))
    .limit(limit);
}
