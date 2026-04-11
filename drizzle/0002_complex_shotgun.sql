ALTER TABLE `unstor_knowledge_nodes` MODIFY COLUMN `relatedPromptIds` json;--> statement-breakpoint
ALTER TABLE `unstor_knowledge_nodes` MODIFY COLUMN `keywords` json;--> statement-breakpoint
ALTER TABLE `unstor_knowledge_nodes` MODIFY COLUMN `examples` json;--> statement-breakpoint
ALTER TABLE `unstor_learning_metrics` MODIFY COLUMN `topTopics` json;--> statement-breakpoint
ALTER TABLE `unstor_owner_queries` MODIFY COLUMN `matchedNodeIds` json;--> statement-breakpoint
ALTER TABLE `unstor_owner_queries` MODIFY COLUMN `matchedTopics` json;--> statement-breakpoint
ALTER TABLE `unstor_prompts` MODIFY COLUMN `extractedTopics` json;--> statement-breakpoint
ALTER TABLE `unstor_prompts` MODIFY COLUMN `extractedKeywords` json;--> statement-breakpoint
ALTER TABLE `unstor_topic_clusters` MODIFY COLUMN `topics` json;--> statement-breakpoint
ALTER TABLE `unstor_topic_clusters` MODIFY COLUMN `nodeIds` json;--> statement-breakpoint
ALTER TABLE `unstor_topic_clusters` MODIFY COLUMN `dominantKeywords` json;