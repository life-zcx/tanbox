import path from 'path';
import fs from 'fs';
import { prisma } from '../config/db';
import { CodeItemStatus } from '@prisma/client';
import { getClientOrderStartIndex, reindexClientOrders } from '../utils/orderNumbering';

export function parseCodesFile(raw: string): { headers: string[]; rows: Record<string, string>[] } {
  const content = raw.replace(/^\uFEFF/, '').trim();
  if (!content) return { headers: [], rows: [] };

  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const isMarkingCode = (str: string): boolean => {
    const clean = str.replace(/^["']|["']$/g, '').trim();
    return /^01\d{14}/.test(clean);
  };

  const stripOuterQuotes = (val: string): string => {
    let s = val.trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      if (s.length >= 2) s = s.slice(1, -1);
    }
    return s.trim();
  };

  const parseCsvTokens = (line: string, delimiter: string): string[] => {
    const tokens: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        tokens.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    tokens.push(cur);
    return tokens.map((t) => stripOuterQuotes(t));
  };

  const firstLine = lines[0];
  const firstClean = stripOuterQuotes(firstLine);

  // Check if first line is a single-column header
  const isSingleHeader = /^(code|код|marking|маркировка|киз|км|datamatrix)$/i.test(firstClean);

  // Check if sample lines are pure marking codes
  const sample = lines.slice(0, Math.min(lines.length, 25));
  const markingCount = sample.filter((l) => isMarkingCode(l)).length;
  const isPredominantlyMarking = markingCount >= Math.min(3, sample.length) || isMarkingCode(firstLine);

  const headerKeywords = /^(code|код|marking|маркировка|gtin|serial|sn|barcode|штрихкод|номенклатура|артикул|article|brand|бренд|наименование|название|цена|price|кол-во|количество)/i;

  let hasExplicitHeader = false;
  let testDelim: string | null = null;
  const semiCount0 = (firstLine.match(/;/g) || []).length;
  const tabCount0 = (firstLine.match(/\t/g) || []).length;
  const commaCount0 = (firstLine.match(/,/g) || []).length;

  if (semiCount0 > 0 && firstLine.split(';').some((c) => headerKeywords.test(stripOuterQuotes(c)))) {
    testDelim = ';';
    hasExplicitHeader = true;
  } else if (tabCount0 > 0 && firstLine.split('\t').some((c) => headerKeywords.test(stripOuterQuotes(c)))) {
    testDelim = '\t';
    hasExplicitHeader = true;
  } else if (commaCount0 > 0 && !isMarkingCode(firstLine) && firstLine.split(',').some((c) => headerKeywords.test(stripOuterQuotes(c)))) {
    testDelim = ',';
    hasExplicitHeader = true;
  }

  // If no explicit multi-column header found, check if it's a 1-column list of codes
  if (!hasExplicitHeader) {
    if (isSingleHeader || isPredominantlyMarking) {
      // 1-COLUMN LIST OF CODES: every line is 1 complete code. Do NOT split by commas/semicolons!
      const startIndex = isSingleHeader ? 1 : 0;
      const rows: Record<string, string>[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const code = stripOuterQuotes(lines[i]);
        if (code) {
          rows.push({ code });
        }
      }
      return { headers: ['code'], rows };
    }

    if (semiCount0 > 0) testDelim = ';';
    else if (tabCount0 > 0) testDelim = '\t';
    else if (commaCount0 > 0) testDelim = ',';
  }

  const delimiter = testDelim;
  if (!delimiter) {
    const startIndex = isSingleHeader ? 1 : 0;
    const rows = lines.slice(startIndex).map((l) => ({ code: stripOuterQuotes(l) })).filter((r) => r.code);
    return { headers: ['code'], rows };
  }

  // Multi-column CSV parsing
  const firstCols = parseCsvTokens(firstLine, delimiter);
  const startIndex = hasExplicitHeader ? 1 : 0;
  const headers = hasExplicitHeader
    ? firstCols
    : firstCols.map((c, idx) => (idx === 0 || isMarkingCode(c) ? 'code' : `col_${idx + 1}`));

  const rows: Record<string, string>[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const cols = parseCsvTokens(lines[i], delimiter);
    const r: Record<string, string> = {};
    headers.forEach((h, idx) => {
      r[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    if (!r['code']) {
      for (const val of cols) {
        if (isMarkingCode(val)) {
          r['code'] = val;
          break;
        }
      }
      if (!r['code'] && cols.length > 0) {
        r['code'] = cols[0];
      }
    }
    rows.push(r);
  }

  return { headers, rows };
}

const activePopulations = new Map<string, Promise<number>>();

export const ensureOrderCodesPopulated = async (orderId: string): Promise<number> => {
  if (activePopulations.has(orderId)) {
    return activePopulations.get(orderId)!;
  }

  const taskPromise = (async (): Promise<number> => {
    try {
      const count = await prisma.orderCodeItem.count({ where: { orderId } });
      if (count > 0) return count;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, orderNumber: true, itemsCount: true, codesFileUrl: true, notes: true, userId: true, createdAt: true },
      });
      if (!order || !order.codesFileUrl) return 0;

      const filePath = path.resolve(process.cwd(), '.' + order.codesFileUrl);
      if (!fs.existsSync(filePath)) return 0;

      const rawContent = await fs.promises.readFile(filePath, 'utf-8');
      const { rows } = parseCodesFile(rawContent);
      if (rows.length === 0) return 0;

      const fileCodes: string[] = [];
      const seen = new Set<string>();
      for (const r of rows) {
        const c = (r.code || Object.values(r)[0] || '').trim();
        if (c && !seen.has(c)) {
          seen.add(c);
          fileCodes.push(c);
        }
      }

      // Check for codes that already exist in OTHER orders (now fast via @@index([code]))
      const existingInDb = new Set<string>();
      for (let i = 0; i < fileCodes.length; i += 2000) {
        const chunk = fileCodes.slice(i, i + 2000);
        const found = await prisma.orderCodeItem.findMany({
          where: {
            code: { in: chunk },
            orderId: { not: order.id },
          },
          select: { code: true },
        });
        for (const f of found) existingInDb.add(f.code);
      }

      const accepted = fileCodes.filter((c) => !existingInDb.has(c));
      if (accepted.length === 0) return 0;

      const startIndex = await getClientOrderStartIndex(order.userId, order.id, order.createdAt);
      const items = accepted.map((code, idx) => {
        let gtin: string | null = null;
        let serial: string | null = null;
        const m = code.match(/^01(\d{14})21([^\u001d\s]+)/);
        if (m) {
          gtin = m[1];
          serial = m[2];
        }
        return {
          orderId: order.id,
          index: startIndex + idx,
          code,
          gtin,
          serial,
          status: CodeItemStatus.NEW,
        };
      });

      const BATCH_SIZE = 2000;
      for (let b = 0; b < items.length; b += BATCH_SIZE) {
        await prisma.orderCodeItem.createMany({ data: items.slice(b, b + BATCH_SIZE) });
      }
      await reindexClientOrders(order.userId);
      return items.length;
    } catch (err) {
      console.warn('Error reading codes file in ensureOrderCodesPopulated:', err);
      return 0;
    } finally {
      activePopulations.delete(orderId);
    }
  })();

  activePopulations.set(orderId, taskPromise);
  return taskPromise;
};

export const attachCodesToOrder = async (
  orderId: string,
  codes: string[],
  gtin?: string | null,
  fileNamePrefix: string = 'markirovka_emission'
): Promise<{ count: number; filePath: string; relativeUrl: string }> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, userId: true, createdAt: true },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const orderDir = path.resolve(process.cwd(), 'uploads', 'orders', order.id);
  if (!fs.existsSync(orderDir)) {
    fs.mkdirSync(orderDir, { recursive: true });
  }

  const cleanCodes = codes.map((c) => (c || '').trim()).filter((c) => c.length > 0);
  const fileName = `${fileNamePrefix}_${order.orderNumber}.csv`;
  const targetFilePath = path.join(orderDir, fileName);
  const relativeUrl = `/uploads/orders/${order.id}/${fileName}`;

  // Write CSV content with all emitted codes
  const csvContent = cleanCodes.join('\n');
  await fs.promises.writeFile(targetFilePath, csvContent, 'utf-8');

  // Populate OrderCodeItem in DB
  await prisma.orderCodeItem.deleteMany({ where: { orderId: order.id } });
  const startIndex = await getClientOrderStartIndex(order.userId, order.id, order.createdAt);

  const items = cleanCodes.map((codeStr, idx) => {
    let itemGtin: string | null = gtin || null;
    let itemSerial: string | null = null;
    const m = codeStr.match(/^01(\d{14})21([^\u001d\s]+)/);
    if (m) {
      itemGtin = m[1];
      itemSerial = m[2];
    }
    return {
      orderId: order.id,
      index: startIndex + idx,
      code: codeStr,
      gtin: itemGtin,
      serial: itemSerial,
      status: CodeItemStatus.NEW,
    };
  });

  const BATCH_SIZE = 2000;
  for (let b = 0; b < items.length; b += BATCH_SIZE) {
    await prisma.orderCodeItem.createMany({
      data: items.slice(b, b + BATCH_SIZE),
      skipDuplicates: true,
    });
  }

  await reindexClientOrders(order.userId);

  // Update Order with the new codes file URL and name
  await prisma.order.update({
    where: { id: order.id },
    data: {
      codesFileUrl: relativeUrl,
      codesFileName: fileName,
      itemsCount: items.length > 0 ? items.length : undefined,
    },
  });

  return { count: items.length, filePath: targetFilePath, relativeUrl };
};
