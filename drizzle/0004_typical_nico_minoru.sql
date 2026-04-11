CREATE TABLE `prompt_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(128) NOT NULL,
	`categoryLabel` varchar(256) NOT NULL,
	`promptText` text NOT NULL,
	`variables` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prompt_templates_id` PRIMARY KEY(`id`)
);
