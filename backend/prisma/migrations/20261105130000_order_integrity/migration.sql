BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "OrderCodeItem" WHERE index <= 0) THEN
    RAISE EXCEPTION 'Non-positive code indices exist. Reindex affected clients before applying order_integrity.';
  END IF;
END $$;
ALTER TABLE "Order" ADD COLUMN "boxesCount" INTEGER,
    ADD COLUMN "includeOfficialCodeFee" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "pricingInputsKnown" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "createKey" TEXT,
    ADD COLUMN "createRequestHash" TEXT,
    ADD COLUMN "documentVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Order" ALTER COLUMN "pricingInputsKnown" SET DEFAULT true;
CREATE UNIQUE INDEX "Order_userId_createKey_key" ON "Order"("userId", "createKey");
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "Invoice" WHERE "orderId" IS NOT NULL AND status IN ('DRAFT','PENDING','PAID') GROUP BY "orderId" HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Multiple active invoices per order exist. Reconcile obligations before applying order_integrity; no invoices were changed.';
  END IF;
END $$;
CREATE UNIQUE INDEX "Invoice_active_order_key" ON "Invoice"("orderId") WHERE status IN ('DRAFT','PENDING','PAID');
ALTER TABLE "MarkirovkaOrder" ADD COLUMN "dispatchStartedAt" TIMESTAMP(3);
-- Unknown outcomes of historical dispatches must be reconciled, never blindly resent.
UPDATE "MarkirovkaOrder" SET "dispatchStartedAt" = "createdAt" WHERE "externalOrderId" IS NULL;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "OrderCodeItem" GROUP BY code HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate marking codes exist. Reconcile OrderCodeItem duplicates before applying order_integrity; no data was deleted.';
  END IF;
END $$;
DROP INDEX IF EXISTS "OrderCodeItem_code_idx";
CREATE UNIQUE INDEX "OrderCodeItem_code_key" ON "OrderCodeItem"("code");

COMMIT;
