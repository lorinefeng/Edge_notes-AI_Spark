CREATE TABLE `user_quotas` (
	`user_id` text PRIMARY KEY NOT NULL,
	`daily_count` integer DEFAULT 0 NOT NULL,
	`last_reset_date` text NOT NULL,
	`monthly_token_usage` integer DEFAULT 0 NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`email_alert_sent` integer DEFAULT false NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
