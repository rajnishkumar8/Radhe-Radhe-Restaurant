CREATE TABLE `site_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentKey` varchar(80) NOT NULL,
	`imageUrl` text,
	`title` varchar(160),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_content_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_content_contentKey_unique` UNIQUE(`contentKey`)
);
--> statement-breakpoint
ALTER TABLE `menu_items` ADD `imagePlacement` varchar(40) DEFAULT 'menu' NOT NULL;