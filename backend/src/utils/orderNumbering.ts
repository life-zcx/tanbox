import { prisma } from '../config/db';

/**
 * Calculates the start index for a new/uploaded batch of codes for an order,
 * ensuring sequential numbering per client across all client orders.
 */
export async function getClientOrderStartIndex(
  userId: string,
  orderId: string,
  orderCreatedAt: Date
): Promise<number> {
  const lastPrecedingItem = await prisma.orderCodeItem.findFirst({
    where: {
      order: {
        userId,
        id: { not: orderId },
        createdAt: { lt: orderCreatedAt },
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
export async function reindexClientOrders(userId: string): Promise<void> {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, orderNumber: true },
  });

  let runningIndex = 1;
  for (const ord of orders) {
    const count = await prisma.orderCodeItem.count({ where: { orderId: ord.id } });
    if (count === 0) continue;

    // First, make indices negative to avoid transient unique constraint collisions on @@unique([orderId, index])
    await prisma.$executeRawUnsafe(
      'UPDATE "OrderCodeItem" SET "index" = -ABS("index") WHERE "orderId" = $1',
      ord.id
    );

    // Then, assign sequential indices starting from runningIndex
    await prisma.$executeRawUnsafe(
      `WITH ranked AS (
         SELECT "orderId", "index" AS old_idx, (${runningIndex} - 1 + row_number() OVER (ORDER BY ABS("index") ASC))::integer AS new_idx
         FROM "OrderCodeItem"
         WHERE "orderId" = $1
       )
       UPDATE "OrderCodeItem"
       SET "index" = ranked.new_idx
       FROM ranked
       WHERE "OrderCodeItem"."orderId" = ranked."orderId" AND "OrderCodeItem"."index" = ranked.old_idx`,
      ord.id
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
