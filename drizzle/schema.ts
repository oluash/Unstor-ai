import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  json,
  bigint,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Unstor activation configuration
 */
export const unstorActivationConfig = mysqlTable("unstor_activation_config", {
  id: int("id").autoincrement().primaryKey(),
  learningStartDate: timestamp("learningStartDate").notNull(),
  activationDate: timestamp("activationDate").notNull(),
  phase: mysqlEnum("phase", ["LEARNING", "ACTIVATING", "ACTIVE"]).default("LEARNING").notNull(),
  personaName: varchar("personaName", { length: 64 }).default("Unstor").notNull(),
  personaTagline: text("personaTagline"),
  personaDescription: text("personaDescription"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UnstorActivationConfig = typeof unstorActivationConfig.$inferSelect;

/**
 * User chat sessions
 */
export const unstorSessions = mysqlTable("unstor_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("sessionKey", { length: 128 }).notNull().unique(),
  userId: int("userId"),
  userOpenId: varchar("userOpenId", { length: 64 }),
  userName: text("userName"),
  totalMessages: int("totalMessages").default(0).notNull(),
  totalTokensIngested: bigint("totalTokensIngested", { mode: "number" }).default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UnstorSession = typeof unstorSessions.$inferSelect;

/**
 * Every prompt and response ingested by Unstor's learning pipeline
 */
export const unstorPrompts = mysqlTable("unstor_prompts", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userOpenId: varchar("userOpenId", { length: 64 }),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  tokenCount: int("tokenCount").default(0).notNull(),
  extractedTopics: json("extractedTopics").$type<string[]>(),
  extractedKeywords: json("extractedKeywords").$type<string[]>(),
  sentimentScore: float("sentimentScore"),
  complexityScore: float("complexityScore"),
  processedByLearning: boolean("processedByLearning").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UnstorPrompt = typeof unstorPrompts.$inferSelect;
export type InsertUnstorPrompt = typeof unstorPrompts.$inferInsert;

/**
 * Knowledge nodes — atomic units of knowledge extracted from prompts
 */
export const unstorKnowledgeNodes = mysqlTable("unstor_knowledge_nodes", {
  id: int("id").autoincrement().primaryKey(),
  nodeKey: varchar("nodeKey", { length: 256 }).notNull().unique(),
  topic: varchar("topic", { length: 256 }).notNull(),
  category: varchar("category", { length: 128 }),
  summary: text("summary"),
  frequency: int("frequency").default(1).notNull(),
  confidenceScore: float("confidenceScore").default(0).notNull(),
  relatedPromptIds: json("relatedPromptIds").$type<number[]>(),
  keywords: json("keywords").$type<string[]>(),
  examples: json("examples").$type<string[]>(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UnstorKnowledgeNode = typeof unstorKnowledgeNodes.$inferSelect;

/**
 * Knowledge graph edges
 */
export const unstorKnowledgeEdges = mysqlTable("unstor_knowledge_edges", {
  id: int("id").autoincrement().primaryKey(),
  fromNodeId: int("fromNodeId").notNull(),
  toNodeId: int("toNodeId").notNull(),
  relationshipType: varchar("relationshipType", { length: 64 }).default("related").notNull(),
  strength: float("strength").default(0.5).notNull(),
  coOccurrenceCount: int("coOccurrenceCount").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UnstorKnowledgeEdge = typeof unstorKnowledgeEdges.$inferSelect;

/**
 * Topic clusters
 */
export const unstorTopicClusters = mysqlTable("unstor_topic_clusters", {
  id: int("id").autoincrement().primaryKey(),
  clusterName: varchar("clusterName", { length: 256 }).notNull(),
  clusterKey: varchar("clusterKey", { length: 256 }).notNull().unique(),
  topics: json("topics").$type<string[]>(),
  nodeIds: json("nodeIds").$type<number[]>(),
  totalFrequency: int("totalFrequency").default(0).notNull(),
  avgConfidence: float("avgConfidence").default(0).notNull(),
  dominantKeywords: json("dominantKeywords").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UnstorTopicCluster = typeof unstorTopicClusters.$inferSelect;

/**
 * Daily learning metrics snapshots
 */
export const unstorLearningMetrics = mysqlTable("unstor_learning_metrics", {
  id: int("id").autoincrement().primaryKey(),
  snapshotDate: timestamp("snapshotDate").notNull(),
  totalPromptsIngested: int("totalPromptsIngested").default(0).notNull(),
  totalKnowledgeNodes: int("totalKnowledgeNodes").default(0).notNull(),
  totalTopicClusters: int("totalTopicClusters").default(0).notNull(),
  totalSessions: int("totalSessions").default(0).notNull(),
  totalTokensProcessed: bigint("totalTokensProcessed", { mode: "number" }).default(0).notNull(),
  readinessScore: float("readinessScore").default(0).notNull(),
  dailyNewNodes: int("dailyNewNodes").default(0).notNull(),
  dailyNewPrompts: int("dailyNewPrompts").default(0).notNull(),
  topTopics: json("topTopics").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UnstorLearningMetrics = typeof unstorLearningMetrics.$inferSelect;

/**
 * Owner inspection queries
 */
export const unstorOwnerQueries = mysqlTable("unstor_owner_queries", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  query: text("query").notNull(),
  response: text("response"),
  matchedNodeIds: json("matchedNodeIds").$type<number[]>(),
  matchedTopics: json("matchedTopics").$type<string[]>(),
  confidenceLevel: float("confidenceLevel"),
  processingTimeMs: int("processingTimeMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UnstorOwnerQuery = typeof unstorOwnerQueries.$inferSelect;