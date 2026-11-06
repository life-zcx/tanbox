// Read-only operational check; requires an explicit DATABASE_URL. No secrets/codes are printed.
const { PrismaClient } = require('../backend/node_modules/@prisma/client');
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL to an explicitly selected validation database');
const db = new PrismaClient();
(async () => {
  const queries = {
    duplicateCodes: `SELECT count(*)::int AS n FROM (SELECT code FROM "OrderCodeItem" GROUP BY code HAVING count(*) > 1) t`,
    duplicateActiveInvoices: `SELECT count(*)::int AS n FROM (SELECT "orderId" FROM "Invoice" WHERE "orderId" IS NOT NULL AND status IN ('DRAFT','PENDING','PAID') GROUP BY "orderId" HAVING count(*) > 1) t`,
    staleInvoices: `SELECT count(*)::int AS n FROM "Invoice" i JOIN "Order" o ON i."orderId"=o.id WHERE i.status IN ('DRAFT','PENDING') AND (i."totalAmount"<>o."totalPrice" OR i."userId"<>o."userId")`,
    negativeIndices: `SELECT count(*)::int AS n FROM "OrderCodeItem" WHERE index <= 0`,
    incompleteOrders: `SELECT count(*)::int AS n FROM "Order" o WHERE EXISTS (SELECT 1 FROM "OrderCodeItem" c WHERE c."orderId"=o.id) AND o."itemsCount"<>(SELECT count(*) FROM "OrderCodeItem" c WHERE c."orderId"=o.id)`,
  };
  const result = {};
  for (const [name, sql] of Object.entries(queries)) result[name] = (await db.$queryRawUnsafe(sql))[0].n;
  console.log(JSON.stringify(result, null, 2));
  if (Object.values(result).some(Boolean)) process.exitCode = 1;
})().catch(() => { console.error('Preflight failed. Database details withheld.'); process.exitCode = 1; }).finally(() => db.$disconnect());
