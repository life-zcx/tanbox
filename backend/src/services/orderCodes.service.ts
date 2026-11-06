import { randomUUID } from 'crypto';
import { computeOrderPricing } from '../utils/pricing';
import { syncPendingOrderInvoices } from './orderFinancials.service';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/db';
import { CodeItemStatus } from '@prisma/client';
import { getClientOrderStartIndex, reindexClientOrders } from '../utils/orderNumbering';
import { advanceOrderStatus } from '../utils/orderLifecycle';

export function parseCodesFile(raw: string): { headers: string[]; rows: Record<string, string>[] } {
  const content = raw.replace(/^\uFEFF/, '').trim();
  if (!content) return { headers: [], rows: [] };

  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const isMarkingCode = (str: string): boolean => {
    const clean = str.replace(/^\uFEFF/, '').replace(/[\u0000-\u001F\u007F-\u009F"']/g, '').trim();
    return /(?:^|[^\d])(?:01|\(01\))\d{14}/.test(clean) || /^01\d{14}/.test(clean);
  };

  const stripOuterQuotes = (val: string): string => {
    let s = val.replace(/^\uFEFF/, '').trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      if (s.length >= 2) s = s.slice(1, -1);
    }
    return s.replace(/[\u0000-\u0008\u000B-\u001C\u001E-\u001F\u007F]/g, '').trim();
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

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, orderNumber: true, itemsCount: true, codesFileUrl: true, notes: true, userId: true, createdAt: true },
      });
      if (!order) return 0;
      if (count === order.itemsCount && count > 0) return count;
      if (!order.codesFileUrl) {
        if (count > 0) throw new Error('Incomplete order code set: authoritative source file required');
        return 0;
      }

      const filePath = path.resolve(process.cwd(), '.' + order.codesFileUrl);
      if (!fs.existsSync(filePath)) {
        if (count > 0) throw new Error('Incomplete order code set and missing source file');
        return 0;
      }

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

      if (fileCodes.length !== order.itemsCount) throw new Error('Source file count differs from order obligation; reconciliation required');
      const result = await attachCodesToOrder(order.id, fileCodes, undefined, 'restored');
      return result.count;
    } catch (err) {
      throw err;
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
  fileNamePrefix: string = 'markirovka_emission',
  options: { reprice?: boolean; originalName?: string } = {},
): Promise<{ count: number; filePath: string; relativeUrl: string }> => {
  if (!codes.length || codes.length > 100000 || codes.some(code => typeof code !== 'string' || !code.trim() || code.length > 2048)) throw new Error('Invalid code batch (1..100000 codes, maximum 2048 characters per code)');
  const cleanCodes = codes.map(code => code.trim());
  if (new Set(cleanCodes).size !== cleanCodes.length) throw new Error('Duplicate codes in batch');
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const orderDir = path.resolve(process.cwd(), 'uploads', 'orders', order.id);
  await fs.promises.mkdir(orderDir, { recursive: true });
  const safePrefix = fileNamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${safePrefix}_${randomUUID()}.csv`;
  const targetFilePath = path.join(orderDir, fileName);
  const relativeUrl = `/uploads/orders/${order.id}/${fileName}`;
  await fs.promises.writeFile(targetFilePath, cleanCodes.join('\n'), { encoding: 'utf8', flag: 'wx' });
  try {
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${order.id} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${order.userId} FOR UPDATE`;
      const current = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
      if (current.status === 'CANCELLED' || current.paymentStatus === 'REFUNDED') throw new Error('Cancelled/refunded order cannot accept codes');
      if (options.reprice && (current.paymentStatus === 'PAID' || await tx.invoice.count({ where: { orderId, status: 'PAID' } }))) throw new Error('Paid order cannot be repriced');
      if (options.reprice && current.pricingInputsKnown === false) throw new Error('Confirm legacy pricing inputs before uploading a new quote');
      if (current.paymentStatus === 'PAID' && current.itemsCount !== cleanCodes.length) throw new Error('Code count does not match paid order');
      if (options.reprice && current.tariffType === 'PRO' && cleanCodes.length < 500) throw new Error('PRO minimum is 500 items');
      const existing = await tx.orderCodeItem.findMany({ where: { orderId }, orderBy: { index: 'asc' }, select: { code: true } });
      const unchanged = existing.length === cleanCodes.length && existing.every((value, index) => value.code === cleanCodes[index]);
      if (!unchanged) {
        const startIndex = await getClientOrderStartIndex(current.userId, current.id, current.createdAt, tx);
        await tx.orderCodeItem.deleteMany({ where: { orderId } });
        const items = cleanCodes.map((code, index) => {
          const match = code.match(/^01(\d{14})21([^\u001d\s]+)/);
          return { orderId, index: startIndex + index, code, gtin: match?.[1] || gtin || null, serial: match?.[2] || null, status: CodeItemStatus.NEW };
        });
        if (new Set(items.map(item => item.gtin).filter(Boolean)).size > 1000) throw new Error('Maximum 1000 product positions per order');
        for (let offset = 0; offset < items.length; offset += 1000) await tx.orderCodeItem.createMany({ data: items.slice(offset, offset + 1000) });
        await reindexClientOrders(current.userId, tx);
        if (await tx.orderPosition.count({ where: { orderId } }) === 0) {
          const groups = new Map<string, number>();
          for (const item of items) groups.set(item.gtin || '', (groups.get(item.gtin || '') || 0) + 1);
          await tx.orderPosition.createMany({ data: [...groups].map(([gtin, quantity], index) => ({ orderId, index: index + 1, name: options.originalName || 'Product', gtin: gtin || null, quantity })) });
        }
      }
      const pricing = options.reprice ? await computeOrderPricing({
        tariffType: current.tariffType, itemsCount: cleanCodes.length, extraServices: current.extraServices,
        ssccNeeded: current.ssccNeeded, boxesCount: current.boxesCount ?? undefined, includeOfficialCodeFee: current.includeOfficialCodeFee,
      }) : null;
      const updated = await tx.order.update({ where: { id: orderId }, data: {
        codesFileUrl: relativeUrl, codesFileName: options.originalName || fileName, itemsCount: cleanCodes.length,
        ...(!unchanged || options.reprice ? { pdfUrl: null, documentVersion: { increment: 1 } } : {}),
        ...(pricing ? { pricePerItem: pricing.unitPrice, totalPrice: pricing.totalPrice, printAllowed: false } : {}),
      } });
      if (pricing) await syncPendingOrderInvoices(tx, updated);
    }, { timeout: 120000 });
  } catch (error) {
    await fs.promises.unlink(targetFilePath).catch(() => {});
    throw error;
  }
  await advanceOrderStatus(order.id, 'CODES_ATTACHED').catch(() => {});
  return { count: cleanCodes.length, filePath: targetFilePath, relativeUrl };
};
