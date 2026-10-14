-- ==============================================================================
-- TANBOX Production Safe Additive Migration: Add VerificationCode table
-- Idempotent, zero-downtime, non-destructive (never drops existing data)
-- ==============================================================================

-- 1. Create Table "VerificationCode"
CREATE TABLE IF NOT EXISTS "VerificationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- 2. Performance Index on email
CREATE INDEX IF NOT EXISTS "VerificationCode_email_idx" ON "VerificationCode"("email");
