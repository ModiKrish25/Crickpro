-- Migration: Add phone authentication support
-- Adds phone and phoneVerified columns to users table

ALTER TABLE `users`
  ADD COLUMN `phone` varchar(20),
  ADD COLUMN `phoneVerified` int DEFAULT 0;
