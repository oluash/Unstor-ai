CREATE TABLE `milestone_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`milestoneKey` varchar(128) NOT NULL,
	`title` varchar(256) NOT NULL,
	`notifiedAt` timestamp NOT NULL DEFAULT (now()),
	`success` boolean NOT NULL DEFAULT true,
	CONSTRAINT `milestone_notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `milestone_notifications_milestoneKey_unique` UNIQUE(`milestoneKey`)
);
