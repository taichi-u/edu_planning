CREATE TABLE `calendar_links` (
	`id` text PRIMARY KEY NOT NULL,
	`calendar_id` text NOT NULL,
	`milestone_id` text NOT NULL,
	`event_id` text,
	`fingerprint` text NOT NULL,
	`pending_fingerprint` text,
	`lease` text,
	`lease_until` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `history` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`project_id` text,
	`created_at` text NOT NULL,
	`summary` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspace` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`body` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL
);
