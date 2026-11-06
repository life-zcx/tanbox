import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';

/**
 * Calculates the start index for a new/uploaded batch of codes for an order,
 * ensuring sequential numbering per client across all client orders.
 */
export async function getClientOrderStartIndex(
  userId: string,
  orderId: string,
  orderCreatedAt: Date,
  client: Prisma.TransactionClient = prisma
): Promise<number> {
  const lastPrecedingItem = await client.orderCodeItem.findFirst({
    where: {
      order: {
        userId,
        id: { not: orderId },
        OR: [{ createdAt: { lt: orderCreatedAt } }, { createdAt: orderCreatedAt, id: { lt: orderId } }],
      },
    },
    orderBy: { index: 'desc' },
    select: { index: true },
  });

  return (lastPrecedingItem?.index || 0) + 1;
}

/**
 * Re-indexes all orders of a client chronologically so that:
 * Order 1: 1 .. N1
 * Order 2: (N1 + 1) .. (N1 + N2)
 * Order 3: (N1 + N2 + 1) .. (N1 + N2 + N3)
 * Guarantees continuous, gapless, client-wide sequential label numbering.
 */
export async function reindexClientOrders(userId: string, client?: Prisma.TransactionClient): Promise<void> {
  if (client) return reindexInTransaction(userId, client);
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    await reindexInTransaction(userId, tx);
  }, { timeout: 60000 });
}

async function reindexInTransaction(userId: string, client: Prisma.TransactionClient): Promise<void> {
  const orders = await client.order.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, orderNumber: true },
  });

  let runningIndex = 1;
  for (const ord of orders) {
    const stats = await client.orderCodeItem.aggregate({
      where: { orderId: ord.id },
      _count: { _all: true },
      _min: { index: true },
      _max: { index: true },
    });

    const count = stats._count._all;
    if (count === 0) continue;

    const expectedMin = runningIndex;
    const expectedMax = runningIndex + count - 1;

    // Skip heavy raw SQL updates if this order's codes are already sequentially indexed
    if (stats._min.index === expectedMin && stats._max.index === expectedMax) {
      runningIndex += count;
      continue;
    }

    // First, make indices negative to avoid transient unique constraint collisions on @@unique([orderId, index])
    await client.$executeRawUnsafe(
      'UPDATE "OrderCodeItem" SET "index" = -ABS("index") WHERE "orderId" = $1',
      ord.id
    );

    // Then, assign sequential indices starting from runningIndex
    await client.$executeRawUnsafe(
      `WITH ranked AS (
         SELECT "orderId", "index" AS old_idx, ($2 - 1 + row_number() OVER (ORDER BY ABS("index") ASC))::integer AS new_idx
         FROM "OrderCodeItem"
         WHERE "orderId" = $1
       )
       UPDATE "OrderCodeItem"
       SET "index" = ranked.new_idx
       FROM ranked
       WHERE "OrderCodeItem"."orderId" = ranked."orderId" AND "OrderCodeItem"."index" = ranked.old_idx`,
      ord.id,
      runningIndex
    );

    runningIndex += count;
  }
}

/**
 * Reindexes all clients in the system.
 */
export async function reindexAllClientsOrders(): Promise<void> {
  const users = await prisma.user.findMany({
    select: { id: true, companyName: true, email: true },
  });

  for (const u of users) {
    await reindexClientOrders(u.id);
  }
}
