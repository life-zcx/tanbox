import { reindexAllClientsOrders } from '../utils/orderNumbering';
import { prisma } from '../config/db';

async function run() {
  console.log('Starting client-wide order reindexing...');
  await reindexAllClientsOrders();
  console.log('Reindexing completed!');

  const users = await prisma.user.findMany({
    include: {
      orders: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          orderNumber: true,
          itemsCount: true,
          codeItems: {
            select: { index: true },
            orderBy: { index: 'asc' },
          },
        },
      },
    },
  });

  for (const u of users) {
    if (u.orders.length === 0) continue;
    console.log(`\nClient: ${u.companyName} (${u.email})`);
    for (const o of u.orders) {
      const first = o.codeItems[0]?.index;
      const last = o.codeItems[o.codeItems.length - 1]?.index;
      console.log(`  Order ${o.orderNumber}: count=${o.codeItems.length}, range=[${first} .. ${last}]`);
    }
  }
}

run()
  .catch((e) => {
    console.error('Error during reindexing:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
