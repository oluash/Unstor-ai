CREATE TABLE `unstor_activation_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learningStartDate` timestamp NOT NULL,
	`activationDate` timestamp NOT NULL,
	`phase` enum('LEARNING','ACTIVATING','ACTIVE') NOT NULL DEFAULT 'LEARNING',
	`personaName` varchar(64) NOT NULL DEFAULT 'Unstor',
	`personaTagline` text,
	`personaDescription` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unstor_activation_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unstor_knowledge_edges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromNodeId` int NOT NULL,
	`toNodeId` int NOT NULL,
	`relationshipType` varchar(64) NOT NULL DEFAULT 'related',
	`strength` float NOT NULL DEFAULT 0.5,
	`coOccurrenceCount` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unstor_knowledge_edges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unstor_knowledge_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nodeKey` varchar(256) NOT NULL,
	`topic` varchar(256) NOT NULL,
	`category` varchar(128),
	`summary` text,
	`frequency` int NOT NULL DEFAULT 1,
	`confidenceScore` float NOT NULL DEFAULT 0,
	`relatedPromptIds` json DEFAULT ('[]'),
	`keywords` json DEFAULT ('[]'),
	`examples` json DEFAULT ('[]'),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unstor_knowledge_nodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `unstor_knowledge_nodes_nodeKey_unique` UNIQUE(`nodeKey`)
);
--> statement-breakpoint
CREATE TABLE `unstor_learning_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotDate` timestamp NOT NULL,
	`totalPromptsIngested` int NOT NULL DEFAULT 0,
	`totalKnowledgeNodes` int NOT NULL DEFAULT 0,
	`totalTopicClusters` int NOT NULL DEFAULT 0,
	`totalSessions` int NOT NULL DEFAULT 0,
	`totalTokensProcessed` bigint NOT NULL DEFAULT 0,
	`readinessScore` float NOT NULL DEFAULT 0,
	`dailyNewNodes` int NOT NULL DEFAULT 0,
	`dailyNewPrompts` int NOT NULL DEFAULT 0,
	`topTopics` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unstor_learning_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unstor_owner_queries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`query` text NOT NULL,
	`response` text,
	`matchedNodeIds` json DEFAULT ('[]'),
	`matchedTopics` json DEFAULT ('[]'),
	`confidenceLevel` float,
	`processingTimeMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unstor_owner_queries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unstor_prompts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userOpenId` varchar(64),
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`tokenCount` int NOT NULL DEFAULT 0,
	`extractedTopics` json DEFAULT ('[]'),
	`extractedKeywords` json DEFAULT ('[]'),
	`sentimentScore` float,
	`complexityScore` float,
	`processedByLearning` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unstor_prompts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unstor_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionKey` varchar(128) NOT NULL,
	`userId` int,
	`userOpenId` varchar(64),
	`userName` text,
	`totalMessages` int NOT NULL DEFAULT 0,
	`totalTokensIngested` bigint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unstor_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `unstor_sessions_sessionKey_unique` UNIQUE(`sessionKey`)
);
--> statement-breakpoint
CREATE TABLE `unstor_topic_clusters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clusterName` varchar(256) NOT NULL,
	`clusterKey` varchar(256) NOT NULL,
	`topics` json DEFAULT ('[]'),
	`nodeIds` json DEFAULT ('[]'),
	`totalFrequency` int NOT NULL DEFAULT 0,
	`avgConfidence` float NOT NULL DEFAULT 0,
	`dominantKeywords` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unstor_topic_clusters_id` PRIMARY KEY(`id`),
	CONSTRAINT `unstor_topic_clusters_clusterKey_unique` UNIQUE(`clusterKey`)
);
