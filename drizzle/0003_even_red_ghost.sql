CREATE TABLE `epigenetics_knowledge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`genePathway` varchar(256),
	`mechanism` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`plainLanguageSummary` text,
	`lifestyleFactors` json,
	`ancestralConnection` text,
	`researchSources` json,
	`keywords` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `epigenetics_knowledge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ifa_odu` (
	`id` int AUTO_INCREMENT NOT NULL,
	`oduNumber` int NOT NULL,
	`primaryName` varchar(128) NOT NULL,
	`alternateNames` json,
	`category` varchar(64),
	`majorOdu` boolean NOT NULL DEFAULT false,
	`parentOdu` varchar(128),
	`eseVerses` text,
	`taboos` text,
	`prescriptions` text,
	`lifeApplications` text,
	`themes` json,
	`herbs` json,
	`offerings` json,
	`colors` json,
	`numbers` json,
	`deities` json,
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ifa_odu_id` PRIMARY KEY(`id`),
	CONSTRAINT `ifa_odu_oduNumber_unique` UNIQUE(`oduNumber`)
);
--> statement-breakpoint
CREATE TABLE `medicine_knowledge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradition` enum('african','chinese_tcm','ifa_yoruba','ayurvedic','other') NOT NULL,
	`herbName` varchar(256) NOT NULL,
	`localNames` json,
	`scientificName` varchar(256),
	`category` varchar(128),
	`uses` text,
	`preparation` text,
	`dosage` text,
	`contraindications` text,
	`interactions` text,
	`properties` json,
	`conditions` json,
	`bodyParts` json,
	`relatedOdu` json,
	`sources` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicine_knowledge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `psychology_knowledge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`framework` varchar(128) NOT NULL,
	`technique` varchar(256),
	`evidenceLevel` enum('established','emerging','speculative') NOT NULL DEFAULT 'established',
	`content` text NOT NULL,
	`practicalApplication` text,
	`contraindications` text,
	`sources` json,
	`keywords` json,
	`conditions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `psychology_knowledge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quantum_knowledge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topic` varchar(256) NOT NULL,
	`subtopic` varchar(256),
	`difficultyLevel` enum('introductory','intermediate','advanced') NOT NULL DEFAULT 'intermediate',
	`content` text NOT NULL,
	`equations` text,
	`plainLanguageSummary` text,
	`ifaBridge` text,
	`sources` json,
	`keywords` json,
	`relatedTopics` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quantum_knowledge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `research_papers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`authors` json,
	`source` varchar(256) NOT NULL,
	`domain` enum('quantum_physics','ifa_studies','yoruba_language','alternative_medicine','epigenetics','medical_education','psychology','philosophy','other') NOT NULL,
	`abstract` text,
	`url` text,
	`doi` varchar(256),
	`credibilityScore` float NOT NULL DEFAULT 0.5,
	`citationCount` int NOT NULL DEFAULT 0,
	`keywords` json,
	`publishedAt` timestamp,
	`ingestedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `research_papers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unstor_knowledge_feeds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedType` enum('url','pdf','text','book','data') NOT NULL,
	`title` varchar(512),
	`sourceUrl` text,
	`rawContent` text,
	`processedContent` text,
	`status` enum('pending','processing','learned','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`chunkCount` int NOT NULL DEFAULT 0,
	`nodesCreated` int NOT NULL DEFAULT 0,
	`wordCount` int NOT NULL DEFAULT 0,
	`tags` json,
	`submittedBy` varchar(64),
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unstor_knowledge_feeds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_learning_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userOpenId` varchar(64) NOT NULL,
	`learningDepth` enum('introductory','intermediate','advanced') NOT NULL DEFAULT 'intermediate',
	`languagePreference` enum('english','yoruba','both') NOT NULL DEFAULT 'english',
	`domainInterests` json,
	`totalSessions` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_learning_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_learning_profiles_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `user_learning_profiles_userOpenId_unique` UNIQUE(`userOpenId`)
);
--> statement-breakpoint
CREATE TABLE `web_crawl_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`url` text NOT NULL,
	`domain` varchar(256),
	`depth` int NOT NULL DEFAULT 0,
	`priority` int NOT NULL DEFAULT 5,
	`status` enum('queued','crawling','done','failed','skipped') NOT NULL DEFAULT 'queued',
	`contentHash` varchar(64),
	`extractedText` text,
	`nodesCreated` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`crawledAt` timestamp,
	`nextCrawlAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `web_crawl_queue_id` PRIMARY KEY(`id`)
);
