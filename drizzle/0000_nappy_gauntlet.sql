CREATE TABLE `enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`kind` text NOT NULL,
	`message` text NOT NULL,
	`consent_version` text NOT NULL,
	`created_at` text NOT NULL
);
