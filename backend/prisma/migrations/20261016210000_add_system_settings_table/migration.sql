-- ==============================================================================
-- TANBOX Production Safe Additive Migration: Add SystemSetting table
-- Idempotent, zero-downtime, non-destructive (never drops existing data)
-- ==============================================================================

-- 1. Create Table "SystemSetting"
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- 2. Performance Index on key
CREATE INDEX IF NOT EXISTS "SystemSetting_key_idx" ON "SystemSetting"("key");
