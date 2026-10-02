import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { OrderCategory, TariffType, OrderStatus } from '@prisma/client';
import { computeOrderPricing } from '../utils/pricing';

function isSafeUrl(url?: string | null): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  // Safe relative paths or http/https URLs
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function findOrderByIdOrNumber(identifier: string) {
  return prisma.order.findFirst({
    where: {
      OR: [
        { id: identifier },
        { orderNumber: identifier },
      ],
    },
    include: {
      user: {
        select: {
          companyName: true,
          binIin: true,
          email: true,
          phone: true,
        },
      },
    },
  });
}

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

    const { category, tariffType, itemsCount, extraServices, ssccNeeded, notes } = req.body;

    if (!category || !tariffType || !itemsCount) {
      return res.status(400).json({ message: 'Заполните обязательные поля заказа' });
    }

    if (!Object.values(OrderCategory).includes(category as OrderCategory)) {
      return res.status(400).json({ message: 'Недопустимая категория товара' });
    }

    if (!Object.values(TariffType).includes(tariffType as TariffType)) {
      return res.status(400).json({ message: 'Недопустимый тариф' });
    }

    const countNum = parseInt(itemsCount, 10);
    if (isNaN(countNum) || countNum <= 0 || countNum > 10000000) {
      return res.status(400).json({ message: 'Количество должно быть положительным целым числом до 10 000 000' });
    }

    // Authoritative server-side price calculation (tamper-proof)
    const pricing = await computeOrderPricing({
      tariffType: tariffType as TariffType,
      itemsCount: countNum,
      extraServices: Array.isArray(extraServices) ? extraServices.map(String) : [],
      ssccNeeded: Boolean(ssccNeeded),
    });

    // Generate readable order number: TB-2026-XXXX
    const count = await prisma.order.count();
    const orderNumber = `TB-2026-${(count + 1).toString().padStart(4, '0')}`;

    // Parse label size from request or notes if custom layout requested
    let stickerWidth = req.body.stickerWidth ? parseInt(req.body.stickerWidth, 10) : 58;
    let stickerHeight = req.body.stickerHeight ? parseInt(req.body.stickerHeight, 10) : 40;

    if (typeof notes === 'string') {
      const sizeMatch = notes.match(/Размер(?: этикетки)?:?\s*(\d+)\s*[×x*]\s*(\d+)/i);
      if (sizeMatch) {
        stickerWidth = parseInt(sizeMatch[1], 10);
        stickerHeight = parseInt(sizeMatch[2], 10);
      }
    }

    const { templateId, stickerLayout: customStickerLayout } = req.body;
    let initialLayout: any = {
      widthMm: stickerWidth || 58,
      heightMm: stickerHeight || 40,
      elements: [], // Пустой макет, заполнен только размер
    };
    let initialApprovalStatus = 'IN_DESIGN';
    let resolvedTemplateId: string | null = null;

    if (templateId) {
      const template = await prisma.userStickerTemplate.findFirst({
        where: { id: templateId, userId: req.user.id },
      });
      if (template) {
        initialLayout = {
          widthMm: template.widthMm,
          heightMm: template.heightMm,
          elements: (template.elements as any) || [],
        };
        initialApprovalStatus = 'APPROVED';
        resolvedTemplateId = template.id;
      }
    } else if (customStickerLayout && Array.isArray(customStickerLayout.elements) && customStickerLayout.elements.length > 0) {
      initialLayout = customStickerLayout;
    }

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId: req.user.id,
        category: category as OrderCategory,
        tariffType: tariffType as TariffType,
        itemsCount: pricing.safeItemsCount,
        pricePerItem: pricing.unitPrice,
        totalPrice: pricing.totalPrice,
        extraServices: Array.isArray(extraServices) ? extraServices.map((s) => String(s).slice(0, 50)) : [],
        ssccNeeded: Boolean(ssccNeeded),
        notes: typeof notes === 'string' ? notes.slice(0, 5000) : '',
        status: OrderStatus.NEW,
        templateId: resolvedTemplateId,
        stickerLayout: initialLayout,
        stickerApprovalStatus: initialApprovalStatus,
      },
    });

    return res.status(201).json({
      message: 'Заказ успешно создан и отправлен на обработку',
      order: newOrder,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return res.status(500).json({ message: 'Ошибка при создании заказа' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

    let whereClause = {};

    // If client, fetch only their own orders. If admin, fetch all.
    if (req.user.role !== 'ADMIN') {
      whereClause = { userId: req.user.id };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            companyName: true,
            binIin: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders);
  } catch (error: any) {
    console.error('Get orders error:', error);
    return res.status(500).json({ message: 'Ошибка получения списка заказов' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

    const { id } = req.params;

    const order = await findOrderByIdOrNumber(id);

    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    // Check ownership if not admin (IDOR protection)
    if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к данному заказу' });
    }

    return res.json(order);
  } catch (error: any) {
    return res.status(500).json({ message: 'Ошибка получения информации о заказе' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Только администратор может изменять статус' });
    }

    const { id } = req.params;
    const { status, pdfUrl, printAllowed, paymentStatus } = req.body;

    if (status && !Object.values(OrderStatus).includes(status as OrderStatus)) {
      return res.status(400).json({ message: 'Некорректный статус заказа' });
    }

    if (pdfUrl !== undefined && !isSafeUrl(pdfUrl)) {
      return res.status(400).json({ message: 'Недопустимый формат URL документа' });
    }

    const existing = await findOrderByIdOrNumber(id);
    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: existing.id },
      data: {
        ...(status ? { status: status as OrderStatus } : {}),
        ...(pdfUrl !== undefined ? { pdfUrl } : {}),
        ...(printAllowed !== undefined ? { printAllowed: Boolean(printAllowed) } : {}),
        ...(paymentStatus !== undefined ? { paymentStatus: String(paymentStatus) } : {}),
      },
    });

    return res.json({
      message: 'Статус заказа обновлен',
      order: updatedOrder,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Ошибка при обновлении статуса заказа' });
  }
};

export const updateOrderPrintPermission = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Только администратор может изменять доступ к печати' });
    }

    const { id } = req.params;
    const { printAllowed, paymentStatus } = req.body;

    const existing = await findOrderByIdOrNumber(id);
    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: existing.id },
      data: {
        ...(printAllowed !== undefined ? { printAllowed: Boolean(printAllowed) } : {}),
        ...(paymentStatus !== undefined ? { paymentStatus: String(paymentStatus) } : {}),
      },
    });

    return res.json({
      message: 'Доступ к печати партии обновлен',
      order: updatedOrder,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Ошибка при обновлении прав на печать' });
  }
};

export const updateStickerLayout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Только администратор может изменять макет стикера' });
    }

    const { id } = req.params;
    const { stickerLayout, sendToClient, pdfUrl } = req.body;

    const existing = await findOrderByIdOrNumber(id);
    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const updateData: any = {};
    if (stickerLayout !== undefined) {
      updateData.stickerLayout = stickerLayout;
    }
    if (pdfUrl !== undefined) {
      updateData.pdfUrl = pdfUrl;
    }

    if (sendToClient) {
      updateData.stickerApprovalStatus = 'WAITING_APPROVAL';
      updateData.stickerSentAt = new Date();
      // Auto move status to PROCESSING if NEW
      if (existing.status === 'NEW') {
        updateData.status = OrderStatus.PROCESSING;
      }
    }

    const { saveToTemplates, templateName } = req.body;
    if (saveToTemplates && stickerLayout && Array.isArray(stickerLayout.elements) && stickerLayout.elements.length > 0) {
      try {
        const name = (templateName && typeof templateName === 'string')
          ? templateName.trim().slice(0, 150)
          : `${existing.category || 'Этикетка'} ${stickerLayout.widthMm || 58}×${stickerLayout.heightMm || 40} мм`;
        
        await prisma.userStickerTemplate.create({
          data: {
            userId: existing.userId,
            name,
            category: existing.category,
            widthMm: Number(stickerLayout.widthMm) || 58,
            heightMm: Number(stickerLayout.heightMm) || 40,
            elements: stickerLayout.elements,
            sourceOrderId: existing.id,
          },
        });
      } catch (e) {
        console.warn('Failed to save to UserStickerTemplate from updateStickerLayout:', e);
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: existing.id },
      data: updateData,
    });

    return res.json({
      message: sendToClient
        ? 'Макет сохранён в БД и передан клиенту на согласование'
        : 'Макет сохранён в БД',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Update sticker layout error:', error);
    return res.status(500).json({ message: 'Ошибка сохранения макета стикера в базе данных' });
  }
};

export const updateStickerApproval = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const { id } = req.params;
    const approvalStatus = req.body.approvalStatus || req.body.status || req.body.action;
    const comment = req.body.comment || req.body.notes;

    if (!['APPROVED', 'CHANGES_REQUESTED'].includes(approvalStatus)) {
      return res.status(400).json({ message: 'Недопустимый статус согласования. Допустимо: APPROVED, CHANGES_REQUESTED' });
    }

    const existing = await findOrderByIdOrNumber(id);
    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    // Protection: client can only approve their own order
    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к данному заказу' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: existing.id },
      data: {
        stickerApprovalStatus: approvalStatus,
        stickerApprovalNotes: comment ? String(comment).slice(0, 1000) : null,
      },
    });

    // Automatically save approved sticker to UserStickerTemplate library for future re-use!
    if (approvalStatus === 'APPROVED') {
      const layout = existing.stickerLayout as any;
      if (layout && Array.isArray(layout.elements) && layout.elements.length > 0) {
        try {
          const existingTpl = await prisma.userStickerTemplate.findFirst({
            where: { userId: existing.userId, sourceOrderId: existing.id },
          });
          const catLabel = existing.category || 'Этикетка';
          const defaultName = `${catLabel} ${layout.widthMm || 58}×${layout.heightMm || 40} мм (Заказ ${existing.orderNumber})`;
          if (!existingTpl) {
            await prisma.userStickerTemplate.create({
              data: {
                userId: existing.userId,
                name: defaultName,
                category: existing.category,
                widthMm: Number(layout.widthMm) || 58,
                heightMm: Number(layout.heightMm) || 40,
                elements: layout.elements,
                sourceOrderId: existing.id,
              },
            });
          } else {
            await prisma.userStickerTemplate.update({
              where: { id: existingTpl.id },
              data: {
                widthMm: Number(layout.widthMm) || 58,
                heightMm: Number(layout.heightMm) || 40,
                elements: layout.elements,
              },
            });
          }
        } catch (saveErr) {
          console.warn('Auto-save UserStickerTemplate warning:', saveErr);
        }
      }
    }

    return res.json({
      message: approvalStatus === 'APPROVED' ? 'Макет успешно утвержден' : 'Запрос на доработку передан дизайнеру',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Update sticker approval error:', error);
    return res.status(500).json({ message: 'Ошибка при согласовании макета' });
  }
};

export const uploadOrderCodesFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не был прикреплен' });
    }

    const existing = await findOrderByIdOrNumber(id);
    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет прав на прикрепление файлов к этому заказу' });
    }

    const relativeUrl = `/uploads/orders/${existing.id}/${req.file.filename}`;

    // Invalidate previously cached PDFs since new codes were uploaded
    const orderDir = path.resolve(process.cwd(), 'uploads', 'orders', existing.id);
    if (fs.existsSync(orderDir)) {
      try {
        const files = fs.readdirSync(orderDir);
        for (const f of files) {
          if (f.toLowerCase().endsWith('.pdf')) {
            fs.unlinkSync(path.join(orderDir, f));
          }
        }
      } catch (cacheErr) {
        console.warn('Could not clear cached PDFs:', cacheErr);
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: existing.id },
      data: {
        codesFileUrl: relativeUrl,
        codesFileName: req.file.originalname,
      },
    });

    // Populate OrderCodeItem table in database for fast access, numbering, and single-item reprinting
    try {
      const rawContent = fs.readFileSync(req.file.path, 'utf-8');
      const { rows } = parseCodesFile(rawContent);
      if (rows.length > 0) {
        await prisma.orderCodeItem.deleteMany({ where: { orderId: existing.id } });
        const items = rows.map((r, idx) => {
          const code = r.code || Object.values(r)[0] || '';
          let gtin: string | null = null;
          let serial: string | null = null;
          const m = code.match(/^01(\d{14})21([^\u001d\s]+)/);
          if (m) {
            gtin = m[1];
            serial = m[2];
          }
          return {
            orderId: existing.id,
            index: idx + 1,
            code,
            gtin,
            serial,
            status: 'NEW',
          };
        });
        const BATCH_SIZE = 2000;
        for (let b = 0; b < items.length; b += BATCH_SIZE) {
          await prisma.orderCodeItem.createMany({ data: items.slice(b, b + BATCH_SIZE) });
        }
      }
    } catch (dbErr) {
      console.warn('Failed to populate OrderCodeItem on upload:', dbErr);
    }

    return res.json({
      message: 'Файл кодов успешно загружен и привязан к заказу',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Upload order codes error:', error);
    return res.status(500).json({ message: 'Ошибка при сохранении файла кодов' });
  }
};

export const downloadOrderCodesFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const { id } = req.params;
    const existing = await findOrderByIdOrNumber(id);
    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к данному заказу' });
    }

    if (!existing.codesFileUrl) {
      return res.status(404).json({ message: 'К данному заказу еще не прикреплен файл кодов' });
    }

    // Resolve file system path
    const filePath = path.resolve(process.cwd(), '.' + existing.codesFileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Файл на сервере не найден' });
    }

    return res.download(filePath, existing.codesFileName || 'codes.csv');
  } catch (error: any) {
    console.error('Download order codes error:', error);
    return res.status(500).json({ message: 'Ошибка при скачивании файла' });
  }
};

export const getOrderCodesContent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const { id } = req.params;
    const existing = await findOrderByIdOrNumber(id);
    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к данному заказу' });
    }

    if (!existing.codesFileUrl) {
      return res.json({ hasCodes: false, headers: [], previewRows: [], totalRows: 0 });
    }

    const filePath = path.resolve(process.cwd(), '.' + existing.codesFileUrl);
    if (!fs.existsSync(filePath)) {
      return res.json({ hasCodes: false, headers: [], previewRows: [], totalRows: 0 });
    }

    const ext = path.extname(existing.codesFileName || existing.codesFileUrl).toLowerCase();
    if (!['.csv', '.txt'].includes(ext)) {
      // Non-CSV format (e.g. PDF or ZIP)
      return res.json({
        hasCodes: true,
        isCsv: false,
        fileName: existing.codesFileName,
        fileUrl: existing.codesFileUrl,
        headers: [],
        previewRows: [],
        totalRows: 0,
      });
    }

    // Helper to parse codes file (CSV, TXT, TSV) with or without headers
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const { headers, rows } = parseCodesFile(rawContent);

    return res.json({
      hasCodes: true,
      isCsv: true,
      fileName: existing.codesFileName,
      fileUrl: existing.codesFileUrl,
      headers: headers.length === 0 ? ['code'] : headers,
      previewRows: rows.slice(0, 100),
      totalRows: rows.length,
    });
  } catch (error: any) {
    console.error('Get order codes content error:', error);
    return res.status(500).json({ message: 'Ошибка чтения файла кодов' });
  }
};

function parseCodesFile(raw: string): { headers: string[]; rows: Record<string, string>[] } {
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

export const adjustOrderItemsCount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

    const { id } = req.params;
    const { itemsCount } = req.body;

    const count = parseInt(String(itemsCount), 10);
    if (isNaN(count) || count < 1 || count > 10000000) {
      return res.status(400).json({ message: 'Недопустимое количество этикеток в заказе' });
    }

    const existing = await findOrderByIdOrNumber(id);
    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к данному заказу' });
    }

    // Recompute pricing with the new count
    const pricing = await computeOrderPricing({
      tariffType: existing.tariffType,
      itemsCount: count,
      extraServices: existing.extraServices,
      ssccNeeded: existing.ssccNeeded,
    });

    // Invalidate cached PDFs on disk so subsequent downloads reflect the updated batch
    const orderDir = path.resolve(process.cwd(), 'uploads', 'orders', existing.id);
    if (fs.existsSync(orderDir)) {
      try {
        const files = fs.readdirSync(orderDir);
        for (const file of files) {
          if (file.endsWith('.pdf')) {
            fs.unlinkSync(path.join(orderDir, file));
          }
        }
      } catch (err) {
        console.warn('Could not clean old order pdf caches:', err);
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: existing.id },
      data: {
        itemsCount: pricing.safeItemsCount,
        pricePerItem: pricing.unitPrice,
        totalPrice: pricing.totalPrice,
        pdfUrl: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            companyName: true,
            binIin: true,
            phone: true,
          },
        },
      },
    });

    return res.json({
      message: `Объем заказа успешно скорректирован до ${pricing.safeItemsCount.toLocaleString('ru-RU')} шт.`,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Adjust order items count error:', error);
    return res.status(500).json({ message: 'Ошибка при корректировке объема заказа' });
  }
};

export const downloadOrderPdf = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

    const { id } = req.params;
    const existing = await findOrderByIdOrNumber(id);

    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к данному заказу' });
    }

    const isSample = req.query.sample === 'true' || req.query.sample === '1';
    const rollQuery = req.query.roll ? parseInt(String(req.query.roll), 10) : undefined;
    const offsetQuery = req.query.offset !== undefined ? parseInt(String(req.query.offset), 10) : undefined;
    const limitQuery = req.query.limit !== undefined ? parseInt(String(req.query.limit), 10) : undefined;
    const isRoll = !isSample && (rollQuery !== undefined || (offsetQuery !== undefined && limitQuery !== undefined));

    // Guard: Clients can only print production batch/rolls if layout is approved AND admin permitted print (payment confirmed)
    // Calibration sample (?sample=true) remains accessible for printer test
    if (req.user.role !== 'ADMIN' && !isSample) {
      if (existing.stickerApprovalStatus !== 'APPROVED') {
        return res.status(403).json({
          message: 'Печать партии заблокирована: макет этикетки ещё не согласован. Сначала согласуйте макет.',
        });
      }

      const isPrintAllowed = (existing as any).printAllowed === true || (existing as any).paymentStatus === 'PAID';
      if (!isPrintAllowed) {
        return res.status(403).json({
          message: 'Печать партии заблокирована: ожидается подтверждение оплаты и разрешение администратора.',
        });
      }
    }

    const orderDir = path.resolve(process.cwd(), 'uploads', 'orders', existing.id);
    const pdfPath = path.join(orderDir, 'labels.pdf');

    const forceRegenerate = req.query.force === 'true' || req.query.refresh === 'true';

    // Return full batch PDF if already generated on disk
    if (!isSample && !isRoll && !forceRegenerate && fs.existsSync(pdfPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Labels_${existing.orderNumber}.pdf"`);
      return fs.createReadStream(pdfPath).pipe(res);
    }

    // Return cached roll PDF if already generated on disk
    if (isRoll && !forceRegenerate) {
      const rollNum = rollQuery || Math.floor((offsetQuery || 0) / (limitQuery || 1000)) + 1;
      const rollCacheFile = path.join(orderDir, `roll_${rollNum}_${offsetQuery || 0}_${limitQuery || 1000}.pdf`);
      if (fs.existsSync(rollCacheFile)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Roll_${rollNum}_${existing.orderNumber}.pdf"`);
        return fs.createReadStream(rollCacheFile).pipe(res);
      }
    }

    // Prepare sticker layout template
    const stickerLayout = existing.stickerLayout as any;
    let templateElements = stickerLayout?.elements || [];
    let w = stickerLayout?.widthMm || 58;
    let h = stickerLayout?.heightMm || 40;

    // Strict validation: cannot generate production rolls or full batch without a designed layout
    if (templateElements.length === 0) {
      if (!isSample) {
        return res.status(400).json({
          message: 'Невозможно сформировать рулоны или файл печати: макет этикетки ещё не разработан и не утверждён в конструкторе.',
        });
      }
      // For single sample calibration, permit a basic sample outline
      templateElements = [
        {
          id: 'txt-brand',
          type: 'text',
          x: 2,
          y: 2,
          width: Math.max(10, w - 12),
          content: existing.user?.companyName || 'ТЕСТОВЫЙ ОБРАЗЕЦ',
          fontSize: 6.5,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          align: 'left',
          rotation: 0,
        },
        {
          id: 'dm-1',
          type: 'datamatrix',
          x: 2,
          y: Math.max(10, h - 14),
          size: 12,
          columnName: 'code',
          matrixStructure: 'four_regions',
          rotation: 0,
        },
        {
          id: 'txt-sub',
          type: 'text',
          x: 2,
          y: Math.max(2, h - 3.5),
          width: Math.max(10, w - 4),
          content: `${w}×${h} мм (КАЛИБРОВКА)`,
          fontSize: 4,
          fontWeight: 'normal',
          fontFamily: 'Arial, sans-serif',
          align: 'center',
          rotation: 0,
        },
      ];
    }

    const template = {
      name: `Стикер ${w}×${h} мм - Заказ ${existing.orderNumber}`,
      widthMm: w,
      heightMm: h,
      elements: templateElements,
    };

    // Prepare code rows from database or client's uploaded CSV/TXT file
    let rows: Record<string, string>[] = [];
    const dbCount = await prisma.orderCodeItem.count({ where: { orderId: existing.id } });
    if (dbCount > 0) {
      const dbItems = await prisma.orderCodeItem.findMany({
        where: { orderId: existing.id },
        orderBy: { index: 'asc' },
        select: { index: true, code: true, gtin: true, serial: true },
      });
      rows = dbItems.map((it) => ({
        code: it.code,
        index: String(it.index),
        number: String(it.index),
        total: String(dbCount),
        gtin: it.gtin || '',
        serial: it.serial || '',
        orderNumber: existing.orderNumber,
      }));
    } else if (existing.codesFileUrl) {
      const csvPath = path.resolve(process.cwd(), '.' + existing.codesFileUrl);
      if (fs.existsSync(csvPath)) {
        try {
          const raw = fs.readFileSync(csvPath, 'utf-8');
          const parsed = parseCodesFile(raw);
          rows = parsed.rows.map((r, idx) => ({
            ...r,
            index: String(idx + 1),
            number: String(idx + 1),
            total: String(parsed.rows.length),
            orderNumber: existing.orderNumber,
          }));
        } catch (e) {
          console.warn('Could not parse CSV for PDF generation:', e);
        }
      }
    }

    // Strict validation: production rolls and batch PDFs MUST have genuine uploaded codes
    if (rows.length === 0) {
      if (isSample) {
        // Test calibration row for single label sample
        rows = [
          {
            code: `010487000000000021${String(existing.orderNumber).replace(/\D/g, '')}0001\u001d91FFD0\u001d92dGVzdA==`,
            barcode: '200000000001',
            brand: existing.user?.companyName || 'TANBOX TEST',
            article: existing.orderNumber,
          },
        ];
      } else {
        return res.status(400).json({
          message: 'Невозможно сформировать рулоны или файл печати: к данному заказу ещё не прикреплен файл с кодами маркировки Data Matrix.',
        });
      }
    }

    const requestLabelGeneratorPdf = (payload: any): Promise<Buffer> => {
      return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);
        const req = http.request(
          {
            hostname: process.env.LABEL_GENERATOR_HOST || 'label-generator',
            port: parseInt(process.env.LABEL_GENERATOR_PORT || '5060', 10),
            path: '/api/labels/generate-pdf',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (microRes) => {
            if (microRes.statusCode && microRes.statusCode >= 400) {
              let errData = '';
              microRes.on('data', (c) => (errData += c));
              microRes.on('end', () =>
                reject(new Error(`Label generator responded with status ${microRes.statusCode}: ${errData}`))
              );
              return;
            }
            const chunks: Buffer[] = [];
            microRes.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            microRes.on('end', () => resolve(Buffer.concat(chunks)));
          }
        );
        req.on('error', (err) => reject(err));
        req.write(postData);
        req.end();
      });
    };

    try {
      let rowsToGenerate = rows;
      let filename = `Labels_${existing.orderNumber}.pdf`;
      let rollNum: number | undefined;

      if (isSample) {
        rowsToGenerate = rows.slice(0, 1);
        filename = `Sample_${existing.orderNumber}.pdf`;
      } else if (isRoll) {
        const start = Math.max(0, offsetQuery || 0);
        const take = Math.max(1, limitQuery || 1000);
        if (start >= rows.length) {
          return res.status(400).json({
            message: `Начальный индекс (${start + 1}) превышает количество доступных кодов (${rows.length})`,
          });
        }
        const end = Math.min(rows.length, start + take);
        rowsToGenerate = rows.slice(start, end);
        rollNum = rollQuery || Math.floor(start / take) + 1;
        filename = `Roll_${rollNum}_(${start + 1}-${end})_${existing.orderNumber}.pdf`;
      }

      const buffer = await requestLabelGeneratorPdf({ template, csvData: rowsToGenerate });

      if (isSample) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        return res.send(buffer);
      }

      if (!fs.existsSync(orderDir)) {
        fs.mkdirSync(orderDir, { recursive: true });
      }

      if (isRoll) {
        const rollCacheFile = path.join(orderDir, `roll_${rollNum}_${offsetQuery || 0}_${limitQuery || 1000}.pdf`);
        fs.writeFileSync(rollCacheFile, buffer);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(buffer);
      }

      // Save full batch to disk for future fast access
      fs.writeFileSync(pdfPath, buffer);

      if (!existing.pdfUrl) {
        await prisma.order.update({
          where: { id: existing.id },
          data: { pdfUrl: `/api/orders/${existing.id}/pdf` },
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    } catch (genErr: any) {
      console.error('Dynamic PDF generation error:', genErr);
      return res.status(500).json({ message: 'Ошибка генерации PDF файла партии: ' + genErr.message });
    }
  } catch (error: any) {
    console.error('Download order PDF error:', error);
    return res.status(500).json({ message: 'Ошибка при выгрузке PDF документа' });
  }
};

export const downloadOrderAct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

    const { id } = req.params;
    const existing = await findOrderByIdOrNumber(id);

    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к данному заказу' });
    }

    const orderDate = new Date(existing.createdAt).toLocaleDateString('ru-RU');
    const actDate = new Date().toLocaleDateString('ru-RU');
    const actNumber = `АКТ-${existing.orderNumber}`;

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Акт приема-передачи выполненных работ ${actNumber}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #111; font-size: 13px; line-height: 1.5; }
  h1 { font-size: 16px; text-align: center; margin-bottom: 5px; text-transform: uppercase; font-weight: 800; }
  .subtitle { text-align: center; color: #555; margin-bottom: 25px; font-size: 12px; }
  .parties { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 12px; }
  .party { width: 48%; }
  .party strong { display: block; margin-bottom: 4px; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { border: 1px solid #333; padding: 8px 10px; text-align: left; }
  th { background-color: #f2f2f2; font-weight: 700; font-size: 12px; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .total-row { font-weight: bold; background: #fafafa; }
  .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
  .sig-block { width: 45%; border-top: 1px solid #111; padding-top: 8px; }
  .stamp-place { height: 60px; color: #999; font-size: 11px; margin-top: 10px; display: flex; align-items: center; justify-content: center; border: 1px dashed #ccc; border-radius: 8px; }
  .no-print { margin-bottom: 20px; padding: 12px; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
  .print-btn { background: #0082FB; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }
  @media print { .no-print { display: none; } body { margin: 15mm; } }
</style>
</head>
<body>
<div class="no-print">
  <span>Официальный бланк документа сформирован в автоматизированной системе TANBOX.</span>
  <button class="print-btn" onclick="window.print()">Распечатать / Сохранить в PDF</button>
</div>

<h1>Акт приема-передачи выполненных работ № ${actNumber}</h1>
<div class="subtitle">к заказу ${existing.orderNumber} от ${orderDate} г. • г. Алматы • ${actDate} г.</div>

<div class="parties">
  <div class="party">
    <strong>Исполнитель:</strong>
    ТОО "TANBOX КАЗАХСТАН"<br>
    БИН: 230940012890<br>
    г. Алматы, ул. Суюнбая 261, Складской комплекс TANBOX HQ<br>
    Тел.: +7 (700) 000-00-00<br>
    Email: support@tanbox.kz
  </div>
  <div class="party">
    <strong>Заказчик:</strong>
    ${existing.user?.companyName || 'ТОО Клиент'}<br>
    БИН / ИИН: ${existing.user?.binIin || '—'}<br>
    Email: ${existing.user?.email || '—'}<br>
    Тел.: ${existing.user?.phone || '—'}
  </div>
</div>

<p>Мы, нижеподписавшиеся, Исполнитель и Заказчик, составили настоящий акт о том, что Исполнителем были выполнены, а Заказчиком приняты следующие работы (услуги) по заказу <strong>${existing.orderNumber}</strong>:</p>

<table>
  <thead>
    <tr>
      <th style="width: 30px;" class="text-center">№</th>
      <th>Наименование выполненных работ (оказанных услуг)</th>
      <th style="width: 70px;" class="text-center">Кол-во</th>
      <th style="width: 50px;" class="text-center">Ед.</th>
      <th style="width: 90px;" class="text-right">Цена, ₸</th>
      <th style="width: 100px;" class="text-right">Сумма, ₸</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="text-center">1</td>
      <td>
        Услуги по цифровой маркировке и подготовке партии кодов Data Matrix (ИС Танба РК)
        <br><small style="color: #666;">Категория: ${existing.category} • Тариф: ${existing.tariffType}</small>
      </td>
      <td class="text-center">${existing.itemsCount.toLocaleString()}</td>
      <td class="text-center">шт.</td>
      <td class="text-right">${existing.pricePerItem.toLocaleString()}</td>
      <td class="text-right">${(existing.itemsCount * existing.pricePerItem).toLocaleString()}</td>
    </tr>
    ${
      existing.extraServices?.includes('STICKER_LAYOUT_DESIGN')
        ? `<tr>
            <td class="text-center">2</td>
            <td>Разработка индивидуального дизайна макета термоэтикетки по ТЗ Заказчика</td>
            <td class="text-center">1</td>
            <td class="text-center">усл.</td>
            <td class="text-right">5 000</td>
            <td class="text-right">5 000</td>
          </tr>`
        : ''
    }
    <tr class="total-row">
      <td colspan="5" class="text-right">ИТОГО:</td>
      <td class="text-right">${existing.totalPrice.toLocaleString()} ₸</td>
    </tr>
    <tr class="total-row">
      <td colspan="5" class="text-right">Без НДС (0%):</td>
      <td class="text-right">0 ₸</td>
    </tr>
    <tr class="total-row">
      <td colspan="5" class="text-right">ВСЕГО К ОПЛАТЕ:</td>
      <td class="text-right" style="font-size: 14px; color: #0082FB;">${existing.totalPrice.toLocaleString()} ₸</td>
    </tr>
  </tbody>
</table>

<p>Всего оказано услуг на сумму <strong>${existing.totalPrice.toLocaleString()} (тенге)</strong>, без НДС. Вышеперечисленные работы (услуги) выполнены полностью и в срок. Заказчик претензий по объему, качеству и срокам оказания услуг не имеет.</p>

<div class="signatures">
  <div class="sig-block">
    <strong>От Исполнителя:</strong>
    Директор ТОО "TANBOX КАЗАХСТАН"<br><br>
    _________________ / _________________
    <div class="stamp-place">М.П. (Печать Исполнителя)</div>
  </div>
  <div class="sig-block">
    <strong>От Заказчика:</strong>
    Руководитель / Представитель<br><br>
    _________________ / _________________
    <div class="stamp-place">М.П. (Печать Заказчика)</div>
  </div>
</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error: any) {
    console.error('Download order act error:', error);
    return res.status(500).json({ message: 'Ошибка формирования Акта выполненных работ' });
  }
};

export const getOrderCodeItems = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const { id } = req.params;
    const existing = await findOrderByIdOrNumber(id);
    if (!existing) return res.status(404).json({ message: 'Заказ не найден' });
    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к этому заказу' });
    }

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit), 10) || 50));
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

    const where: any = { orderId: existing.id };
    if (status) {
      where.status = status;
    }
    if (search) {
      const searchNum = parseInt(search, 10);
      if (!isNaN(searchNum)) {
        where.OR = [
          { index: searchNum },
          { code: { contains: search, mode: 'insensitive' } },
          { gtin: { contains: search } },
          { serial: { contains: search, mode: 'insensitive' } },
        ];
      } else {
        where.OR = [
          { code: { contains: search, mode: 'insensitive' } },
          { gtin: { contains: search } },
          { serial: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    const [total, items] = await Promise.all([
      prisma.orderCodeItem.count({ where }),
      prisma.orderCodeItem.findMany({
        where,
        orderBy: { index: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return res.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error: any) {
    console.error('Get order code items error:', error);
    return res.status(500).json({ message: 'Ошибка получения списка кодов маркировки' });
  }
};

export const downloadSingleItemPdf = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const { id, itemIndex } = req.params;
    const existing = await findOrderByIdOrNumber(id);
    if (!existing) return res.status(404).json({ message: 'Заказ не найден' });
    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к этому заказу' });
    }

    const idx = parseInt(String(itemIndex), 10);
    if (isNaN(idx) || idx < 1) {
      return res.status(400).json({ message: 'Некорректный номер этикетки' });
    }

    const item = await prisma.orderCodeItem.findUnique({
      where: { orderId_index: { orderId: existing.id, index: idx } },
    });
    if (!item) {
      return res.status(404).json({ message: `Этикетка №${idx} не найдена в заказе` });
    }

    const stickerLayout = existing.stickerLayout as any;
    let templateElements = stickerLayout?.elements || [];
    let w = stickerLayout?.widthMm || 58;
    let h = stickerLayout?.heightMm || 40;

    if (templateElements.length === 0) {
      return res.status(400).json({
        message: 'Макет этикетки ещё не разработан и не утверждён в конструкторе.',
      });
    }

    const template = {
      name: `Стикер ${w}×${h} мм - Заказ ${existing.orderNumber} №${idx}`,
      widthMm: w,
      heightMm: h,
      elements: templateElements,
    };

    const row = {
      code: item.code,
      index: String(item.index),
      number: String(item.index),
      gtin: item.gtin || '',
      serial: item.serial || '',
      orderNumber: existing.orderNumber,
    };

    const requestLabelGeneratorPdf = (payload: any): Promise<Buffer> => {
      return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);
        const request = http.request(
          {
            hostname: process.env.LABEL_GENERATOR_HOST || 'label-generator',
            port: parseInt(process.env.LABEL_GENERATOR_PORT || '5060', 10),
            path: '/api/labels/generate-pdf',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (microRes) => {
            if (microRes.statusCode && microRes.statusCode >= 400) {
              let errData = '';
              microRes.on('data', (c) => (errData += c));
              microRes.on('end', () =>
                reject(new Error(`Label generator error: ${errData}`))
              );
              return;
            }
            const chunks: Buffer[] = [];
            microRes.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            microRes.on('end', () => resolve(Buffer.concat(chunks)));
          }
        );
        request.on('error', (err) => reject(err));
        request.write(postData);
        request.end();
      });
    };

    const buffer = await requestLabelGeneratorPdf({ template, csvData: [row] });

    await prisma.orderCodeItem.update({
      where: { id: item.id },
      data: { status: 'REPRINTED', printedAt: new Date() },
    });

    const filename = `Label_№${idx}_${existing.orderNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error: any) {
    console.error('Download single item PDF error:', error);
    return res.status(500).json({ message: 'Ошибка при генерации этикетки: ' + error.message });
  }
};

export const downloadRangeItemsPdf = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const { id } = req.params;
    const existing = await findOrderByIdOrNumber(id);
    if (!existing) return res.status(404).json({ message: 'Заказ не найден' });
    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к этому заказу' });
    }

    const fromIdx = Math.max(1, parseInt(String(req.query.from || req.body?.from), 10) || 1);
    const toIdx = Math.max(fromIdx, parseInt(String(req.query.to || req.body?.to), 10) || fromIdx);

    if (toIdx - fromIdx > 2000) {
      return res.status(400).json({ message: 'Диапазон перепечатки не должен превышать 2000 этикеток за один запрос' });
    }

    const items = await prisma.orderCodeItem.findMany({
      where: {
        orderId: existing.id,
        index: { gte: fromIdx, lte: toIdx },
      },
      orderBy: { index: 'asc' },
    });

    if (items.length === 0) {
      return res.status(404).json({ message: `Этикетки в диапазоне с ${fromIdx} по ${toIdx} не найдены` });
    }

    const stickerLayout = existing.stickerLayout as any;
    let templateElements = stickerLayout?.elements || [];
    let w = stickerLayout?.widthMm || 58;
    let h = stickerLayout?.heightMm || 40;

    if (templateElements.length === 0) {
      return res.status(400).json({
        message: 'Макет этикетки ещё не разработан и не утверждён в конструкторе.',
      });
    }

    const template = {
      name: `Стикеры ${w}×${h} мм - Заказ ${existing.orderNumber} (${fromIdx}-${toIdx})`,
      widthMm: w,
      heightMm: h,
      elements: templateElements,
    };

    const rows = items.map((it) => ({
      code: it.code,
      index: String(it.index),
      number: String(it.index),
      gtin: it.gtin || '',
      serial: it.serial || '',
      orderNumber: existing.orderNumber,
    }));

    const requestLabelGeneratorPdf = (payload: any): Promise<Buffer> => {
      return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);
        const request = http.request(
          {
            hostname: process.env.LABEL_GENERATOR_HOST || 'label-generator',
            port: parseInt(process.env.LABEL_GENERATOR_PORT || '5060', 10),
            path: '/api/labels/generate-pdf',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (microRes) => {
            if (microRes.statusCode && microRes.statusCode >= 400) {
              let errData = '';
              microRes.on('data', (c) => (errData += c));
              microRes.on('end', () =>
                reject(new Error(`Label generator error: ${errData}`))
              );
              return;
            }
            const chunks: Buffer[] = [];
            microRes.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            microRes.on('end', () => resolve(Buffer.concat(chunks)));
          }
        );
        request.on('error', (err) => reject(err));
        request.write(postData);
        request.end();
      });
    };

    const buffer = await requestLabelGeneratorPdf({ template, csvData: rows });

    await prisma.orderCodeItem.updateMany({
      where: {
        orderId: existing.id,
        index: { gte: fromIdx, lte: toIdx },
      },
      data: { status: 'REPRINTED', printedAt: new Date() },
    });

    const filename = `Labels_(${fromIdx}-${toIdx})_${existing.orderNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error: any) {
    console.error('Download range items PDF error:', error);
    return res.status(500).json({ message: 'Ошибка при генерации диапазона этикеток: ' + error.message });
  }
};


