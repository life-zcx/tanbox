-- ==============================================================================
-- TANBOX Production Safe Additive Migration: Add OnlinePayment and balance
-- Idempotent, zero-downtime, non-destructive
-- ==============================================================================

-- 1. Add balance column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "balance" DECIMAL(12, 2) NOT NULL DEFAULT 0.0;

-- 2. Create Enums if they do not exist
DO $$ BEGIN
    CREATE TYPE "OnlinePaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OnlinePaymentType" AS ENUM ('ORDER', 'INVOICE', 'STICKER_LAYOUT', 'BALANCE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create OnlinePayment table
CREATE TABLE IF NOT EXISTS "OnlinePayment" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "invoiceId" TEXT,
    "type" "OnlinePaymentType" NOT NULL DEFAULT 'ORDER',
    "amount" DECIMAL(12, 2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KZT',
    "status" "OnlinePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "pgPaymentId" TEXT,
    "pgCardPan" TEXT,
    "pgPaymentDate" TIMESTAMP(3),
    "redirectUrl" TEXT,
    "rawResponse" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnlinePayment_pkey" PRIMARY KEY ("id")
);

-- 4. Create Unique Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "OnlinePayment_paymentNumber_key" ON "OnlinePayment"("paymentNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "OnlinePayment_pgPaymentId_key" ON "OnlinePayment"("pgPaymentId");

-- 5. Create Regular Indexes
CREATE INDEX IF NOT EXISTS "OnlinePayment_userId_idx" ON "OnlinePayment"("userId");
CREATE INDEX IF NOT EXISTS "OnlinePayment_orderId_idx" ON "OnlinePayment"("orderId");
CREATE INDEX IF NOT EXISTS "OnlinePayment_status_idx" ON "OnlinePayment"("status");
CREATE INDEX IF NOT EXISTS "OnlinePayment_createdAt_idx" ON "OnlinePayment"("createdAt");

-- 6. Add Foreign Keys
DO $$ BEGIN
    ALTER TABLE "OnlinePayment" ADD CONSTRAINT "OnlinePayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "OnlinePayment" ADD CONSTRAINT "OnlinePayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
