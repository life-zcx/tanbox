import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseCodesFile(raw: string): string[] {
  const content = raw.replace(/^\uFEFF/, '').trim();
  if (!content) return [];
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const stripOuterQuotes = (val: string): string => {
    let s = val.trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      if (s.length >= 2) s = s.slice(1, -1);
    }
    return s.trim();
  };

  const isMarkingCode = (str: string): boolean => {
    const clean = str.replace(/^["']|["']$/g, '').trim();
    return /^01\d{14}/.test(clean);
  };

  const firstClean = stripOuterQuotes(lines[0]);
  const isSingleHeader = /^(code|код|marking|маркировка|киз|км|datamatrix)$/i.test(firstClean);
  const startIndex = isSingleHeader ? 1 : 0;

  const result: string[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const code = stripOuterQuotes(lines[i]);
    if (code) result.push(code);
  }
  return result;
}

async function backfill() {
  const orders = await prisma.order.findMany({
    where: { codesFileUrl: { not: null } },
  });

  console.log(`Found ${orders.length} orders with codesFileUrl`);

  for (const order of orders) {
    if (!order.codesFileUrl) continue;
    const filePath = path.resolve(process.cwd(), '.' + order.codesFileUrl);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found for order ${order.orderNumber}: ${filePath}`);
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const codes = parseCodesFile(raw);
    console.log(`Order ${order.orderNumber}: parsed ${codes.length} codes`);

    await prisma.orderCodeItem.deleteMany({ where: { orderId: order.id } });

    const items = codes.map((code, idx) => {
      let gtin: string | null = null;
      let serial: string | null = null;
      const m = code.match(/^01(\d{14})21([^\u001d\s]+)/);
      if (m) {
        gtin = m[1];
        serial = m[2];
      }
      return {
        orderId: order.id,
        index: idx + 1,
        code,
        gtin,
        serial,
        status: 'NEW',
      };
    });

    const BATCH_SIZE = 2000;
    for (let b = 0; b < items.length; b += BATCH_SIZE) {
      const batch = items.slice(b, b + BATCH_SIZE);
      await prisma.orderCodeItem.createMany({ data: batch });
    }

    console.log(`Order ${order.orderNumber}: successfully inserted ${items.length} items into OrderCodeItem`);
  }

  const count = await prisma.orderCodeItem.count();
  console.log(`Total OrderCodeItem rows in DB: ${count}`);
}

backfill()
  .catch((e) => {
    console.error('Backfill error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
