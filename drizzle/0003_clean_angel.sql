CREATE TABLE `note_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`note_id` integer NOT NULL,
	`user_id` text,
	`guest_name` text,
	`content` text NOT NULL,
	`is_anonymous` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `comments_note_id_idx` ON `note_comments` (`note_id`);--> statement-breakpoint
CREATE TABLE `note_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`note_id` integer NOT NULL,
	`user_id` text,
	`ip_address` text,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `likes_note_id_idx` ON `note_likes` (`note_id`);--> statement-breakpoint
CREATE INDEX `likes_user_id_idx` ON `note_likes` (`user_id`);--> statement-breakpoint
CREATE INDEX `likes_ip_address_idx` ON `note_likes` (`ip_address`);--> statement-breakpoint
CREATE TABLE `note_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`note_id` integer NOT NULL,
	`user_id` text,
	`visitor_hash` text,
	`location` text,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `views_note_id_idx` ON `note_views` (`note_id`);--> statement-breakpoint
ALTER TABLE `notes` ADD `view_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `notes` ADD `like_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `notes` ADD `comment_count` integer DEFAULT 0 NOT NULL;