-- ==============================================================================
-- TANBOX Production Safe Additive Migration: Add Telegram fields to User table
-- Idempotent, zero-downtime, non-destructive (never drops existing data)
-- ==============================================================================

-- 1. Add Telegram columns to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telegramChatId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telegramUsername" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telegramAuthToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telegramLinkedAt" TIMESTAMP(3);

-- 2. Create Unique Indexes for fast lookups and constraint enforcement
CREATE UNIQUE INDEX IF NOT EXISTS "User_telegramChatId_key" ON "User"("telegramChatId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_telegramAuthToken_key" ON "User"("telegramAuthToken");
