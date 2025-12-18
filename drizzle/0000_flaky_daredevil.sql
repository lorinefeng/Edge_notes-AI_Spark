CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`slug` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `slug_idx` ON `notes` (`slug`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `notes` (`user_id`);