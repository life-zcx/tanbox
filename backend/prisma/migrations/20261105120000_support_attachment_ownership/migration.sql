BEGIN;
-- Only authenticated bug-report uploads create ownership records.
-- Legacy notes/email are untrusted and must never be used to backfill ownership.
CREATE TABLE "SupportAttachment" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportAttachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupportAttachment_filename_key" ON "SupportAttachment"("filename");
CREATE INDEX "SupportAttachment_ownerId_idx" ON "SupportAttachment"("ownerId");
CREATE INDEX "SupportAttachment_leadId_idx" ON "SupportAttachment"("leadId");

ALTER TABLE "SupportAttachment" ADD CONSTRAINT "SupportAttachment_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportAttachment" ADD CONSTRAINT "SupportAttachment_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "ServiceLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
