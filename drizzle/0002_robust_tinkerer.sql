ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `phoneVerified` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);