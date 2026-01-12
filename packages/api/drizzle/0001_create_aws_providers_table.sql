CREATE TABLE `aws_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`region` text NOT NULL,
	`account_id` text NOT NULL,
	`access_key_id` text NOT NULL,
	`secret_access_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `aws_providers_name_unique` ON `aws_providers` (`name`);