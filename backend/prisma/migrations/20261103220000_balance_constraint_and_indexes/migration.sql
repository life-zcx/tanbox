-- Sanitize any legacy negative balance before adding constraint
UPDATE "User" SET "balance" = 0.00 WHERE "balance" < 0;

-- AlterTable
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_balance_non_negative'
    ) THEN
        ALTER TABLE "User" ADD CONSTRAINT "user_balance_non_negative" CHECK (balance >= 0);
    END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_binIin_idx" ON "User"("binIin");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ServiceLead_status_createdAt_idx" ON "ServiceLead"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Invoice_customerBinIin_idx" ON "Invoice"("customerBinIin");

