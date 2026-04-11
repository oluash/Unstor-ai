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

/**
 * Knowledge feeds — URLs, books, PDFs, raw text submitted by owner for Unstor to learn from
 */
export const unstorKnowledgeFeeds = mysqlTable("unstor_knowledge_feeds", {
  id: int("id").autoincrement().primaryKey(),
  feedType: mysqlEnum("feedType", ["url", "pdf", "text", "book", "data"]).notNull(),
  title: varchar("title", { length: 512 }),
  sourceUrl: text("sourceUrl"),
  rawContent: text("rawContent"),
  processedContent: text("processedContent"),
  status: mysqlEnum("status", ["pending", "processing", "learned", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  chunkCount: int("chunkCount").default(0).notNull(),
  nodesCreated: int("nodesCreated").default(0).notNull(),
  wordCount: int("wordCount").default(0).notNull(),
  tags: json("tags").$type<string[]>(),
  submittedBy: varchar("submittedBy", { length: 64 }),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UnstorKnowledgeFeed = typeof unstorKnowledgeFeeds.$inferSelect;
export type InsertUnstorKnowledgeFeed = typeof unstorKnowledgeFeeds.$inferInsert;

/**
 * Ifá Odù — all 256 Odù of Ifá with full knowledge
 */
export const ifaOdu = mysqlTable("ifa_odu", {
  id: int("id").autoincrement().primaryKey(),
  oduNumber: int("oduNumber").notNull().unique(),
  primaryName: varchar("primaryName", { length: 128 }).notNull(),
  alternateNames: json("alternateNames").$type<string[]>(),
  category: varchar("category", { length: 64 }),
  majorOdu: boolean("majorOdu").default(false).notNull(),
  parentOdu: varchar("parentOdu", { length: 128 }),
  eseVerses: text("eseVerses"),
  taboos: text("taboos"),
  prescriptions: text("prescriptions"),
  lifeApplications: text("lifeApplications"),
  themes: json("themes").$type<string[]>(),
  herbs: json("herbs").$type<string[]>(),
  offerings: json("offerings").$type<string[]>(),
  colors: json("colors").$type<string[]>(),
  numbers: json("numbers").$type<number[]>(),
  deities: json("deities").$type<string[]>(),
  summary: text("summary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IfaOdu = typeof ifaOdu.$inferSelect;

/**
 * Medicine knowledge — African herbs, Chinese TCM, Yoruba onísègùn tradition
 */
export const medicineKnowledge = mysqlTable("medicine_knowledge", {
  id: int("id").autoincrement().primaryKey(),
  tradition: mysqlEnum("tradition", ["african", "chinese_tcm", "ifa_yoruba", "ayurvedic", "other"]).notNull(),
  herbName: varchar("herbName", { length: 256 }).notNull(),
  localNames: json("localNames").$type<string[]>(),
  scientificName: varchar("scientificName", { length: 256 }),
  category: varchar("category", { length: 128 }),
  uses: text("uses"),
  preparation: text("preparation"),
  dosage: text("dosage"),
  contraindications: text("contraindications"),
  interactions: text("interactions"),
  properties: json("properties").$type<string[]>(),
  conditions: json("conditions").$type<string[]>(),
  bodyParts: json("bodyParts").$type<string[]>(),
  relatedOdu: json("relatedOdu").$type<string[]>(),
  sources: json("sources").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MedicineKnowledge = typeof medicineKnowledge.$inferSelect;

/**
 * Web crawl queue — URLs queued for autonomous background learning
 */
export const webCrawlQueue = mysqlTable("web_crawl_queue", {
  id: int("id").autoincrement().primaryKey(),
  url: text("url").notNull(),
  domain: varchar("domain", { length: 256 }),
  depth: int("depth").default(0).notNull(),
  priority: int("priority").default(5).notNull(),
  status: mysqlEnum("status", ["queued", "crawling", "done", "failed", "skipped"]).default("queued").notNull(),
  contentHash: varchar("contentHash", { length: 64 }),
  extractedText: text("extractedText"),
  nodesCreated: int("nodesCreated").default(0).notNull(),
  errorMessage: text("errorMessage"),
  researchDomain: mysqlEnum("researchDomain", ["quantum_physics", "ifa_studies", "yoruba_language", "alternative_medicine", "epigenetics", "medical_education", "psychology", "philosophy", "general"]).default("general"),
  credibilityScore: int("credibilityScore").default(50),
  sourceAuthority: varchar("sourceAuthority", { length: 128 }),
  crawledAt: timestamp("crawledAt"),
  nextCrawlAt: timestamp("nextCrawlAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebCrawlQueue = typeof webCrawlQueue.$inferSelect;

/**
 * Quantum physics knowledge base
 */
export const quantumKnowledge = mysqlTable("quantum_knowledge", {
  id: int("id").autoincrement().primaryKey(),
  topic: varchar("topic", { length: 256 }).notNull(),
  subtopic: varchar("subtopic", { length: 256 }),
  difficultyLevel: mysqlEnum("difficultyLevel", ["introductory", "intermediate", "advanced"]).default("intermediate").notNull(),
  content: text("content").notNull(),
  equations: text("equations"),
  plainLanguageSummary: text("plainLanguageSummary"),
  ifaBridge: text("ifaBridge"),
  sources: json("sources").$type<string[]>(),
  keywords: json("keywords").$type<string[]>(),
  relatedTopics: json("relatedTopics").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuantumKnowledge = typeof quantumKnowledge.$inferSelect;

/**
 * Psychology and behavioural science knowledge base
 */
export const psychologyKnowledge = mysqlTable("psychology_knowledge", {
  id: int("id").autoincrement().primaryKey(),
  framework: varchar("framework", { length: 128 }).notNull(),
  technique: varchar("technique", { length: 256 }),
  evidenceLevel: mysqlEnum("evidenceLevel", ["established", "emerging", "speculative"]).default("established").notNull(),
  content: text("content").notNull(),
  practicalApplication: text("practicalApplication"),
  contraindications: text("contraindications"),
  sources: json("sources").$type<string[]>(),
  keywords: json("keywords").$type<string[]>(),
  conditions: json("conditions").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PsychologyKnowledge = typeof psychologyKnowledge.$inferSelect;

/**
 * Epigenetics and systems biology knowledge base
 */
export const epigeneticsKnowledge = mysqlTable("epigenetics_knowledge", {
  id: int("id").autoincrement().primaryKey(),
  genePathway: varchar("genePathway", { length: 256 }),
  mechanism: varchar("mechanism", { length: 256 }).notNull(),
  content: text("content").notNull(),
  plainLanguageSummary: text("plainLanguageSummary"),
  lifestyleFactors: json("lifestyleFactors").$type<string[]>(),
  ancestralConnection: text("ancestralConnection"),
  researchSources: json("researchSources").$type<string[]>(),
  keywords: json("keywords").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EpigeneticsKnowledge = typeof epigeneticsKnowledge.$inferSelect;

/**
 * Research papers ingested from arXiv, PubMed, and other academic sources
 */
export const researchPapers = mysqlTable("research_papers", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  authors: json("authors").$type<string[]>(),
  source: varchar("source", { length: 256 }).notNull(),
  domain: mysqlEnum("domain", ["quantum_physics", "ifa_studies", "yoruba_language", "alternative_medicine", "epigenetics", "medical_education", "psychology", "philosophy", "other"]).notNull(),
  abstract: text("abstract"),
  url: text("url"),
  doi: varchar("doi", { length: 256 }),
  credibilityScore: float("credibilityScore").default(0.5).notNull(),
  citationCount: int("citationCount").default(0).notNull(),
  keywords: json("keywords").$type<string[]>(),
  publishedAt: timestamp("publishedAt"),
  ingestedAt: timestamp("ingestedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResearchPaper = typeof researchPapers.$inferSelect;

/**
 * User learning profiles — personalised depth and language preferences
 */
export const userLearningProfiles = mysqlTable("user_learning_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  userOpenId: varchar("userOpenId", { length: 64 }).notNull().unique(),
  learningDepth: mysqlEnum("learningDepth", ["introductory", "intermediate", "advanced"]).default("intermediate").notNull(),
  languagePreference: mysqlEnum("languagePreference", ["english", "yoruba", "both"]).default("english").notNull(),
  domainInterests: json("domainInterests").$type<string[]>(),
  totalSessions: int("totalSessions").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserLearningProfile = typeof userLearningProfiles.$inferSelect;
/**
 * Prompt Templates Library — 50 categories, 18,933+ unique prompts
 * Generated from the Unstor Prompt Templates Library (1,000,000+ combinations)
 */
export const promptTemplates = mysqlTable("prompt_templates", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 128 }).notNull(),
  categoryLabel: varchar("categoryLabel", { length: 256 }).notNull(),
  promptText: text("promptText").notNull(),
  variables: json("variables").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PromptTemplate = typeof promptTemplates.$inferSelect;
