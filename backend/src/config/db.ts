import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : undefined;
if (databaseUrl) {
  for (const [name, value] of Object.entries({ connection_limit: '5', connect_timeout: '5', pool_timeout: '5' })) {
    if (!databaseUrl.searchParams.has(name)) databaseUrl.searchParams.set(name, value);
  }
}

export const prisma = new PrismaClient({
  ...(databaseUrl ? { datasources: { db: { url: databaseUrl.toString() } } } : {}),
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
