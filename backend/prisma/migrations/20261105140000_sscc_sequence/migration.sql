BEGIN;
CREATE SEQUENCE "sscc_serial_seq" MINVALUE 1 MAXVALUE 999999999 NO CYCLE;
CREATE TABLE "SsccAllocation" (
  "code" TEXT PRIMARY KEY,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Move beyond historical timestamp-derived serials. Never reuse their range.
SELECT setval('sscc_serial_seq', GREATEST(COALESCE(MAX(
  CASE WHEN ("requestPayload"->>'sscc') ~ '^0000487000[0-9]{10}$'
    THEN substring("requestPayload"->>'sscc' from 11 for 9)::bigint ELSE 0 END
), 0), 0) + 1, false) FROM "MarkirovkaOperation";

COMMIT;
