import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { OrderCategory, TariffType, OrderStatus } from '@prisma/client';
import { computeOrderPricing } from '../utils/pricing';
import { pdfQueue } from '../services/pdfQueue.service';
import { renderHtmlToPdf } from '../services/pdfRenderer.service';

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

function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

export const getDefaultStickerLayout = (widthMm: number, heightMm: number, companyName?: string) => {
  const w = widthMm || 58;
  const h = heightMm || 40;
  const dmSize = Math.min(22, Math.floor(h * 0.55));

  return {
    widthMm: w,
    heightMm: h,
    elements: [
      {
        id: 'el-dm',
        type: 'datamatrix',
        x: 3,
        y: 4,
        size: dmSize,
        columnName: 'code',
        matrixStructure: 'four_regions',
        rotation: 0,
      },
      {
        id: 'el-title',
        type: 'text',
        x: dmSize + 6,
        y: 4,
        width: Math.max(10, w - dmSize - 8),
        content: companyName || 'МАРКИРОВКА ТОВАРА',
        fontSize: 6.5,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        align: 'left',
        rotation: 0,
      },
      {
        id: 'el-gtin',
        type: 'text',
        x: dmSize + 6,
        y: 11,
        width: Math.max(10, w - dmSize - 8),
        content: 'GTIN: {gtin}',
        fontSize: 5,
        fontWeight: 'normal',
        fontFamily: 'Arial, sans-serif',
        align: 'left',
        rotation: 0,
      },
      {
        id: 'el-serial',
        type: 'text',
        x: dmSize + 6,
        y: 16,
        width: Math.max(10, w - dmSize - 8),
        content: 'С/Н: {serial}',
        fontSize: 5,
        fontWeight: 'normal',
        fontFamily: 'Arial, sans-serif',
        align: 'left',
        rotation: 0,
      },
      {
        id: 'el-eac',
        type: 'eac',
        x: w - 9,
        y: h - 9,
        width: 6,
        height: 6,
        rotation: 0,
      },
    ],
  };
};

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

    const hasAddress =
      (typeof req.body.warehouseAddress === 'string' && req.body.warehouseAddress.trim().length > 0) ||
      (typeof notes === 'string' && /Адрес склада/i.test(notes));
    if (!hasAddress) {
      return res.status(400).json({ message: 'Пожалуйста, укажите адрес склада в РК' });
    }

    // Authoritative server-side price calculation (tamper-proof)
    const pricing = await computeOrderPricing({
      tariffType: tariffType as TariffType,
      itemsCount: countNum,
      extraServices: Array.isArray(extraServices) ? extraServices.map(String) : [],
      ssccNeeded: Boolean(ssccNeeded),
    });

    // Generate readable order number: TB-XXXX (e.g. TB-0001, TB-0002)
    const count = await prisma.order.count();
    let nextNum = count + 1;
    let orderNumber = `TB-${nextNum.toString().padStart(4, '0')}`;
    while (await prisma.order.findUnique({ where: { orderNumber } })) {
      nextNum += 1;
      orderNumber = `TB-${nextNum.toString().padStart(4, '0')}`;
    }

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

    const servicesList = Array.isArray(extraServices) ? extraServices.map((s) => String(s).slice(0, 50)) : [];
    const isDigital = tariffType === 'DIGITAL';
    const hasRequestedDesignService = servicesList.includes('STICKER_LAYOUT_DESIGN');

    const { templateId, stickerLayout: customStickerLayout } = req.body;
    let initialLayout: any = null;
    let initialApprovalStatus = 'APPROVED';
    let resolvedTemplateId: string | null = null;

    // 1. If client chose a saved template from their library, ALWAYS prioritize it for ANY tariff
    if (templateId) {
      const template = await prisma.userStickerTemplate.findFirst({
        where: { id: String(templateId), userId: req.user.id },
      });
      if (template) {
        initialLayout = {
          widthMm: template.widthMm,
          heightMm: template.heightMm,
          elements: (template.elements as any) || [],
        };
        initialApprovalStatus = 'APPROVED';
        resolvedTemplateId = template.id;
        stickerWidth = template.widthMm;
        stickerHeight = template.heightMm;
      }
    }

    // 2. If client passed explicit layout elements from frontend
    if (!initialLayout && customStickerLayout && Array.isArray(customStickerLayout.elements) && customStickerLayout.elements.length > 0) {
      initialLayout = customStickerLayout;
      initialApprovalStatus = 'APPROVED';
      stickerWidth = customStickerLayout.widthMm || stickerWidth;
      stickerHeight = customStickerLayout.heightMm || stickerHeight;
    }

    // 3. If client ordered paid custom design service (+5 000 ₸)
    if (!initialLayout && hasRequestedDesignService) {
      initialLayout = { widthMm: stickerWidth || 58, heightMm: stickerHeight || 40, elements: [] };
      initialApprovalStatus = 'IN_DESIGN';
    }

    // 4. Default standard auto-generated layout
    if (!initialLayout) {
      initialLayout = getDefaultStickerLayout(stickerWidth || 58, stickerHeight || 40, req.user.companyName);
      initialApprovalStatus = 'APPROVED';
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

    // Check if sticker template is already saved in UserStickerTemplate library
    let savedTemplate: any = null;
    if (order.templateId) {
      savedTemplate = await prisma.userStickerTemplate.findUnique({
        where: { id: order.templateId },
        select: { id: true, name: true, widthMm: true, heightMm: true, createdAt: true },
      });
    }
    if (!savedTemplate) {
      savedTemplate = await prisma.userStickerTemplate.findFirst({
        where: {
          userId: order.userId,
          sourceOrderId: order.id,
        },
        select: { id: true, name: true, widthMm: true, heightMm: true, createdAt: true },
      });
    }

    return res.json({
      ...order,
      isTemplateSaved: Boolean(savedTemplate || order.templateId),
      savedTemplate: savedTemplate || null,
    });
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
      // Invalidate cached PDFs so any new PDF uses the updated layout
      const orderDir = path.resolve(process.cwd(), 'uploads', 'orders', existing.id);
      if (fs.existsSync(orderDir)) {
        try {
          const files = fs.readdirSync(orderDir);
          for (const f of files) {
            if (f.endsWith('.pdf')) {
              try { fs.unlinkSync(path.join(orderDir, f)); } catch {}
            }
          }
        } catch (e) {
          console.warn('Could not clear cached PDFs on stickerLayout update:', e);
        }
      }
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
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      return res.status(403).json({ message: 'Нет прав на прикрепление файлов к этому заказу' });
    }

    const rawContent = fs.readFileSync(req.file.path, 'utf-8');
    const { rows } = parseCodesFile(rawContent);

    if (rows.length === 0) {
      if (fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      return res.status(400).json({ message: 'Файл пустой или не содержит распознаваемых кодов маркировки' });
    }

    // 1. Deduplicate within the file itself
    const fileCodesWithRows: { code: string; row: Record<string, string> }[] = [];
    const seenInFile = new Set<string>();
    let internalDupesCount = 0;

    for (const r of rows) {
      const rawCode = (r.code || Object.values(r)[0] || '').trim();
      if (!rawCode) continue;

      if (seenInFile.has(rawCode)) {
        internalDupesCount++;
        continue;
      }

      seenInFile.add(rawCode);
      fileCodesWithRows.push({ code: rawCode, row: r });
    }

    // 2. Check for existing codes in the database across ALL other orders
    const existingDbCodesSet = new Set<string>();
    const allUniqueCodes = fileCodesWithRows.map((it) => it.code);
    const CHECK_BATCH_SIZE = 2000;

    for (let i = 0; i < allUniqueCodes.length; i += CHECK_BATCH_SIZE) {
      const chunk = allUniqueCodes.slice(i, i + CHECK_BATCH_SIZE);
      const foundInDb = await prisma.orderCodeItem.findMany({
        where: {
          code: { in: chunk },
          orderId: { not: existing.id },
        },
        select: { code: true },
      });
      for (const item of foundInDb) {
        existingDbCodesSet.add(item.code);
      }
    }

    // 3. Filter out codes that are already in DB
    const acceptedItems: { code: string; row: Record<string, string> }[] = [];
    let skippedDbCount = 0;

    for (const item of fileCodesWithRows) {
      if (existingDbCodesSet.has(item.code)) {
        skippedDbCount++;
      } else {
        acceptedItems.push(item);
      }
    }

    // 4. If all codes already exist in DB, reject upload
    if (acceptedItems.length === 0) {
      if (fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      return res.status(400).json({
        message: `Загрузка отклонена: все коды из файла (${rows.length} шт.) уже существуют в базе данных в других заказах!`,
        totalInFile: rows.length,
        skippedDbCount,
        internalDupesCount,
      });
    }

    // 5. Invalidate cached PDFs since codes changed
    const orderDir = path.resolve(process.cwd(), 'uploads', 'orders', existing.id);
    if (!fs.existsSync(orderDir)) {
      fs.mkdirSync(orderDir, { recursive: true });
    } else {
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

    // Save cleaned file with only accepted unique codes
    const targetFilePath = path.join(orderDir, req.file.filename);
    const cleanedFileContent = acceptedItems.map((it) => it.code).join('\n');
    fs.writeFileSync(targetFilePath, cleanedFileContent, 'utf-8');

    if (req.file.path !== targetFilePath && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }

    const relativeUrl = `/uploads/orders/${existing.id}/${req.file.filename}`;

    const updatedOrder = await prisma.order.update({
      where: { id: existing.id },
      data: {
        codesFileUrl: relativeUrl,
        codesFileName: req.file.originalname,
        itemsCount: acceptedItems.length,
      },
      include: {
        user: {
          select: { companyName: true, binIin: true, email: true, phone: true },
        },
      },
    });

    // 6. Populate OrderCodeItem with only accepted, non-duplicate codes
    try {
      await prisma.orderCodeItem.deleteMany({ where: { orderId: existing.id } });
      const items = acceptedItems.map((item, idx) => {
        let gtin: string | null = null;
        let serial: string | null = null;
        const m = item.code.match(/^01(\d{14})21([^\u001d\s]+)/);
        if (m) {
          gtin = m[1];
          serial = m[2];
        }
        return {
          orderId: existing.id,
          index: idx + 1,
          code: item.code,
          gtin,
          serial,
          status: 'NEW',
        };
      });

      const BATCH_SIZE = 2000;
      for (let b = 0; b < items.length; b += BATCH_SIZE) {
        await prisma.orderCodeItem.createMany({ data: items.slice(b, b + BATCH_SIZE) });
      }
    } catch (dbErr) {
      console.warn('Failed to populate OrderCodeItem on upload:', dbErr);
    }

    // 7. Formulate feedback message
    let message = `Файл кодов успешно загружен (${acceptedItems.length} шт.). Дубликатов в базе не обнаружено.`;
    if (skippedDbCount > 0 || internalDupesCount > 0) {
      const details: string[] = [];
      if (skippedDbCount > 0) details.push(`пропущено уже имеющихся в базе: ${skippedDbCount} шт.`);
      if (internalDupesCount > 0) details.push(`пропущено повторов в файле: ${internalDupesCount} шт.`);
      message = `Успешно загружено новых кодов: ${acceptedItems.length} шт. (${details.join(', ')}).`;
    }

    return res.json({
      message,
      order: updatedOrder,
      totalInFile: rows.length,
      loadedCount: acceptedItems.length,
      skippedDbCount,
      internalDupesCount,
    });
  } catch (error: any) {
    console.error('Upload order codes error:', error);
    return res.status(500).json({ message: 'Ошибка при сохранении файла кодов' });
  }
};

export const checkCodesFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Файл с кодами маркировки не передан' });
    }

    const rawContent = fs.readFileSync(req.file.path, 'utf-8');
    const { rows } = parseCodesFile(rawContent);

    // Remove temporary file
    if (fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }

    if (!rows || rows.length === 0) {
      return res.status(400).json({ message: 'В файле не найдено строк с кодами маркировки' });
    }

    const seenInFile = new Set<string>();
    let internalDupesCount = 0;
    const uniqueCodes: string[] = [];

    for (const r of rows) {
      const rawCode = (r.code || Object.values(r)[0] || '').trim();
      if (!rawCode) continue;

      if (seenInFile.has(rawCode)) {
        internalDupesCount++;
        continue;
      }

      seenInFile.add(rawCode);
      uniqueCodes.push(rawCode);
    }

    // Check against DB across ALL orders
    const existingDbCodesSet = new Set<string>();
    const CHECK_BATCH_SIZE = 2000;
    const sampleExistingCodes: string[] = [];

    for (let i = 0; i < uniqueCodes.length; i += CHECK_BATCH_SIZE) {
      const chunk = uniqueCodes.slice(i, i + CHECK_BATCH_SIZE);
      const foundInDb = await prisma.orderCodeItem.findMany({
        where: {
          code: { in: chunk },
        },
        select: { code: true },
      });
      for (const item of foundInDb) {
        existingDbCodesSet.add(item.code);
        if (sampleExistingCodes.length < 5) {
          sampleExistingCodes.push(item.code);
        }
      }
    }

    const alreadyInDbCount = existingDbCodesSet.size;
    const validNewCodesCount = Math.max(0, uniqueCodes.length - alreadyInDbCount);

    let message = '';
    if (alreadyInDbCount > 0 || internalDupesCount > 0) {
      const parts: string[] = [];
      if (alreadyInDbCount > 0) parts.push(`${alreadyInDbCount.toLocaleString('ru-RU')} уже зарегистрированы в базе`);
      if (internalDupesCount > 0) parts.push(`${internalDupesCount.toLocaleString('ru-RU')} повторов в файле`);
      message = `В файле ${rows.length.toLocaleString('ru-RU')} кодов: ${parts.join(', ')}. Доступно к заказу: ${validNewCodesCount.toLocaleString('ru-RU')} новых уникальных кодов.`;
    } else {
      message = `Все ${validNewCodesCount.toLocaleString('ru-RU')} кодов уникальны и проверены по базе данных.`;
    }

    return res.json({
      totalInFile: rows.length,
      uniqueInFile: uniqueCodes.length,
      internalDuplicatesCount: internalDupesCount,
      alreadyInDbCount,
      validNewCodesCount,
      sampleExistingCodes,
      message,
    });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    console.error('Check codes file error:', error);
    return res.status(500).json({ message: 'Ошибка при проверке файла кодов: ' + error.message });
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

    // Protection: clients cannot alter count if already paid or in production workflow
    if (req.user.role !== 'ADMIN') {
      if (['PROCESSING', 'PRINTING', 'STICKERING', 'COMPLETED', 'CANCELLED'].includes(existing.status)) {
        return res.status(400).json({
          message: 'Невозможно изменить объем: заказ уже находится в обработке или завершен.',
        });
      }
      if (existing.paymentStatus === 'PAID') {
        return res.status(400).json({
          message: 'Невозможно изменить объем: данный заказ уже оплачен. Для изменения обратитесь к менеджеру.',
        });
      }
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
        printAllowed: false,
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

    // Guard: Clients can only print production batch/rolls if layout is approved (when custom design was ordered) AND admin permitted print (payment confirmed)
    // Calibration sample (?sample=true) remains accessible for printer test
    if (req.user.role !== 'ADMIN' && !isSample) {
      const hasDesignService = Array.isArray(existing.extraServices) && existing.extraServices.includes('STICKER_LAYOUT_DESIGN');
      if (hasDesignService && existing.stickerApprovalStatus !== 'APPROVED') {
        return res.status(403).json({
          message: 'Печать партии заблокирована: индивидуальный макет этикетки ещё не согласован. Сначала согласуйте макет.',
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

    // If templateElements is empty, check if order has saved template in library
    if (templateElements.length === 0 && existing.templateId) {
      const savedTpl = await prisma.userStickerTemplate.findUnique({
        where: { id: existing.templateId },
      });
      if (savedTpl && Array.isArray(savedTpl.elements) && savedTpl.elements.length > 0) {
        templateElements = savedTpl.elements as any[];
        w = savedTpl.widthMm;
        h = savedTpl.heightMm;
      }
    }

    // If still empty, auto-fallback to default standard layout
    if (templateElements.length === 0) {
      const defaultLayout = getDefaultStickerLayout(w, h, existing.user?.companyName);
      templateElements = defaultLayout.elements;
    }

    const template = {
      name: `Стикер ${w}×${h} мм - Заказ ${existing.orderNumber}`,
      widthMm: w,
      heightMm: h,
      elements: templateElements,
    };

    // Prepare code rows from database or client's uploaded CSV/TXT file
    const bcMatch = existing.notes?.match(/Штрихкод(?:\s*\(EAN-13\))?:?\s*(\d+)/i);
    const orderBarcode = bcMatch ? bcMatch[1].trim() : undefined;

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
        barcode: orderBarcode || it.gtin || '',
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
            barcode: orderBarcode || '',
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
            barcode: orderBarcode || '2000000000018',
            brand: existing.user?.companyName || 'TANBOX TEST',
            article: existing.orderNumber,
          },
        ];
      } else if (req.user.role === 'ADMIN') {
        // If admin generates batch for order where codes file not attached yet, generate full order count
        rows = Array.from({ length: existing.itemsCount }, (_, i) => ({
          code: `010460000000000021${String(existing.orderNumber).replace(/\D/g, '')}${String(i + 1).padStart(5, '0')}\u001d91FFD0\u001d92dGVzdA==`,
          barcode: orderBarcode || `20000000${String(i + 1).padStart(5, '0')}`,
          brand: existing.user?.companyName || 'Бренд',
          article: existing.orderNumber,
          index: String(i + 1),
          number: String(i + 1),
          total: String(existing.itemsCount),
          orderNumber: existing.orderNumber,
        }));
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

      const queueKey = isRoll
        ? `order_${existing.id}_roll_${rollNum}_${offsetQuery || 0}_${limitQuery || 1000}`
        : isSample
        ? `order_${existing.id}_sample`
        : `order_${existing.id}_full`;

      const taskDesc = isRoll
        ? `Заказ ${existing.orderNumber} - Рулон ${rollNum} (${rowsToGenerate.length} шт.)`
        : isSample
        ? `Заказ ${existing.orderNumber} - Образец`
        : `Заказ ${existing.orderNumber} - Вся партия (${rowsToGenerate.length} шт.)`;

      const buffer = await pdfQueue.enqueue(queueKey, taskDesc, () =>
        requestLabelGeneratorPdf({ template, csvData: rowsToGenerate })
      );

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

// Helper function to format amount in words for Kazakh tenge
const numberToWordsTenge = (num: number): string => {
  if (num === 0) return 'ноль тенге 00 тиын';

  const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const onesFemale = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const teens = [
    'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать',
    'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'
  ];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

  const convertGroup = (n: number, isFemale = false): string => {
    let result = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;

    if (h > 0) result += hundreds[h] + ' ';
    if (t === 1) {
      result += teens[o] + ' ';
    } else {
      if (t > 1) result += tens[t] + ' ';
      if (o > 0) result += (isFemale ? onesFemale[o] : ones[o]) + ' ';
    }
    return result.trim();
  };

  const integerPart = Math.floor(Math.abs(num));
  const millions = Math.floor(integerPart / 1_000_000) % 1000;
  const thousands = Math.floor(integerPart / 1000) % 1000;
  const units = integerPart % 1000;

  let words = '';

  if (millions > 0) {
    words += convertGroup(millions) + ' ';
    const last = millions % 10;
    const last2 = millions % 100;
    if (last2 >= 11 && last2 <= 19) words += 'миллионов ';
    else if (last === 1) words += 'миллион ';
    else if (last >= 2 && last <= 4) words += 'миллиона ';
    else words += 'миллионов ';
  }

  if (thousands > 0) {
    words += convertGroup(thousands, true) + ' ';
    const last = thousands % 10;
    const last2 = thousands % 100;
    if (last2 >= 11 && last2 <= 19) words += 'тысяч ';
    else if (last === 1) words += 'тысяча ';
    else if (last >= 2 && last <= 4) words += 'тысячи ';
    else words += 'тысяч ';
  }

  if (units > 0) {
    words += convertGroup(units) + ' ';
  }

  const trimmed = words.trim();
  if (!trimmed) return 'ноль теңге 00 тиын';
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return `${capitalized} теңге 00 тиын`;
};

function parseStickeringEstimateFromNotes(notes?: string | null) {
  if (!notes) return null;
  const match = notes.match(/=== УТВЕРЖДЕННАЯ СМЕТА ВЫЕЗДНОЙ ОКЛЕЙКИ ===([\s\S]*?)(?:={20,}|$)/i);
  if (!match) return null;

  const content = match[1];
  const dateMatch = content.match(/Дата расчета:\s*([^\n\r]+)/i);
  const workersMatch = content.match(/Бригада:\s*(\d+)\s*чел/i);
  const daysMatch = content.match(/Срок выполнения:\s*([\d.]+)\s*раб/i);
  const priceMatch = content.match(/Тариф оклейки:\s*([\d.]+)/i);
  const totalMatch = content.match(/Итоговая стоимость:\s*([^\n\r]+)/i);
  const condMatch = content.match(/Условия склада:\s*([^\n\r]+)/i);

  return {
    date: dateMatch ? dateMatch[1].trim() : '',
    workersCount: workersMatch ? parseInt(workersMatch[1], 10) : 1,
    daysNeeded: daysMatch ? parseFloat(daysMatch[1]) : 1,
    pricePerUnit: priceMatch ? parseFloat(priceMatch[1]) : 0,
    totalPrice: totalMatch ? parseFloat(totalMatch[1].replace(/[^\d.]/g, '')) : 0,
    warehouseCondition: condMatch ? condMatch[1].trim() : '',
  };
}

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

    const monthsGenitive = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const createdDateObj = new Date(existing.createdAt);
    const orderDateFull = `${createdDateObj.getDate()} ${monthsGenitive[createdDateObj.getMonth()]} ${createdDateObj.getFullYear()}`;
    const nowDateObj = new Date();
    const actDateFull = `${nowDateObj.getDate()} ${monthsGenitive[nowDateObj.getMonth()]} ${nowDateObj.getFullYear()}`;
    const actNumber = existing.orderNumber.replace(/^[^\d]*-?/, '') || existing.orderNumber;

    const formatMoney = (n: number) => {
      const parts = n.toFixed(2).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return `${parts[0]},${parts[1]}`;
    };
    const formatQty = (n: number) => {
      const parts = n.toFixed(3).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return `${parts[0]},${parts[1]}`;
    };

    // Category naming for all 11 KZ goods categories
    const catMap: Record<string, string> = {
      SHOES: 'Обувные товары',
      TEXTILE: 'Товары легкой промышленности (текстиль)',
      MEDICINE: 'Лекарственные препараты',
      WATER: 'Упакованная вода и напитки',
      TOBACCO: 'Табачные изделия',
      BEER: 'Пиво и пивные напитки',
      OILS: 'Моторные масла',
      DIETARY_SUPPLEMENTS: 'Биологически активные добавки (БАД)',
      JEWELRY: 'Ювелирные изделия',
      SAIGA: 'Дериваты рогов сайгака',
      OTHER: 'Потребительские товары',
    };
    const categoryName = catMap[existing.category] || existing.category;

    const stickeringEst = parseStickeringEstimateFromNotes(existing.notes);
    const isOnSite = existing.tariffType === 'STANDARD' || existing.tariffType === 'PRO' || existing.extraServices?.includes('ON_SITE_STICKERING') || Boolean(stickeringEst);

    let baseServiceName = `Услуги по цифровой маркировке и подготовке партии кодов Data Matrix (ИС Танба РК) [Категория: ${categoryName}, Тариф: ${existing.tariffType}]`;
    if (stickeringEst) {
      baseServiceName = `Услуги по выездной оклейке и маркировке партии товаров на складе Заказчика под ключ [Категория: ${categoryName}, бригада: ${stickeringEst.workersCount} чел., срок: ${stickeringEst.daysNeeded} дн., расходные материалы включены]`;
    } else if (isOnSite) {
      baseServiceName = `Услуги по выездной оклейке и маркировке партии товаров на складе Заказчика под ключ [Категория: ${categoryName}, Тариф: ${existing.tariffType}]`;
    }

    // Build line items
    interface ActLineItem {
      name: string;
      unit: string;
      qty: number;
      price: number;
      sum: number;
    }

    const lines: ActLineItem[] = [];

    // 1. Base Service
    const baseSum = existing.itemsCount * existing.pricePerItem;
    lines.push({
      name: baseServiceName,
      unit: 'шт.',
      qty: existing.itemsCount,
      price: existing.pricePerItem,
      sum: baseSum,
    });

    // 2. Sticker Layout Design
    if (existing.extraServices?.includes('STICKER_LAYOUT_DESIGN')) {
      lines.push({
        name: 'Разработка индивидуального дизайна макета термоэтикетки по ТЗ Заказчика (в соответствии с требованиями СТ РК / ГОСТ)',
        unit: 'усл.',
        qty: 1,
        price: 5000,
        sum: 5000,
      });
    }

    // 3. SSCC Aggregation
    if (existing.ssccNeeded) {
      const isPro = existing.tariffType === 'PRO';
      lines.push({
        name: 'Услуги агрегации в групповые короба и паллеты (формирование кодов транспортной тары SSCC)',
        unit: 'шт.',
        qty: existing.itemsCount,
        price: isPro ? 0 : 5,
        sum: isPro ? 0 : existing.itemsCount * 5,
      });
    }

    // 4. Urgent Processing (24 hours)
    if (existing.extraServices?.includes('URGENT_PROCESSING')) {
      const urgentSum = Math.round(baseSum * 0.2);
      lines.push({
        name: 'Срочное приоритетное исполнение заказа (обработка и выпуск партии в течение 24 часов) (+20%)',
        unit: 'усл.',
        qty: 1,
        price: urgentSum,
        sum: urgentSum,
      });
    }

    // 5. Express Delivery
    if (existing.extraServices?.includes('EXPRESS_DELIVERY')) {
      lines.push({
        name: 'Курьерская доставка партии готовых стикеров на склад Заказчика по РК',
        unit: 'усл.',
        qty: 1,
        price: 15000,
        sum: 15000,
      });
    }

    // Calculate sum of lines vs recorded totalPrice
    const calculatedSum = lines.reduce((acc, it) => acc + it.sum, 0);
    const finalTotal = existing.totalPrice || calculatedSum;
    if (lines.length > 0 && calculatedSum !== finalTotal) {
      const otherSums = lines.slice(1).reduce((acc, it) => acc + it.sum, 0);
      lines[0].sum = Math.max(0, finalTotal - otherSums);
      lines[0].price = lines[0].qty > 0 ? Math.round((lines[0].sum / lines[0].qty) * 100) / 100 : lines[0].price;
    }
    const amountInWords = numberToWordsTenge(finalTotal);

    // Extract warehouse address from notes if available
    let customerAddress = 'Республика Казахстан';
    if (existing.notes) {
      const addrMatch = existing.notes.match(/Адрес склада(?: в РК)?:?\s*([^\n;]+)/i);
      if (addrMatch && addrMatch[1]?.trim()) {
        customerAddress = addrMatch[1].trim();
      }
    }

    const totalQty = lines.reduce((acc, it) => acc + it.qty, 0);
    const orderDateShort = new Date(existing.createdAt).toLocaleDateString('ru-RU');
    const actDateShort = new Date().toLocaleDateString('ru-RU');

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Акт выполненных работ № ${escapeHtml(actNumber)} (Форма Р-1)</title>
<style>
  @page {
    size: A4 landscape;
    margin: 8mm 12mm 8mm 12mm;
  }
  body {
    font-family: Arial, "Times New Roman", serif;
    margin: 8px 15px;
    color: #000;
    font-size: 8.5pt;
    line-height: 1.25;
    background-color: #fff;
  }
  .app-header {
    text-align: right;
    font-size: 7.5pt;
    line-height: 1.2;
    margin-bottom: 8px;
    color: #000;
    font-style: italic;
  }
  .app-header strong {
    font-style: normal;
    font-size: 8pt;
  }
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 4px;
    font-size: 8pt;
  }
  .meta-table td {
    vertical-align: top;
    padding: 1px 0;
  }
  .underline-val {
    border-bottom: 1px solid #000;
    font-weight: bold;
    padding-bottom: 1px;
    line-height: 1.2;
  }
  .sub-note {
    font-size: 6.5pt;
    text-align: center;
    color: #444;
    font-style: italic;
    line-height: 1.1;
  }
  .bin-box {
    border: 1px solid #000;
    padding: 2px 6px;
    font-weight: bold;
    font-size: 8.5pt;
    text-align: center;
    letter-spacing: 0.5px;
  }
  .title-block {
    text-align: center;
    font-weight: bold;
    font-size: 10pt;
    margin: 8px 0 6px 0;
    letter-spacing: 0.3px;
  }
  .items-table {
    width: 100%;
    border-collapse: collapse;
    border: 2px solid #000;
    margin-bottom: 4px;
    font-size: 7.5pt;
  }
  .items-table th, .items-table td {
    border: 1px solid #000;
    padding: 3px 4px;
  }
  .items-table th {
    background-color: #fff;
    font-weight: bold;
    text-align: center;
    line-height: 1.15;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .font-bold { font-weight: bold; }
  .notes-block {
    font-size: 8pt;
    margin-top: 6px;
    line-height: 1.3;
  }
  .signatures-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    font-size: 8pt;
  }
  .mp-box {
    width: 36px;
    height: 22px;
    border: 1px solid #000;
    text-align: center;
    line-height: 22px;
    font-weight: bold;
    font-size: 7.5pt;
    margin-top: 6px;
  }
</style>
</head>
<body>

<div class="app-header">
  Приложение 50<br>
  к приказу Министра финансов<br>
  Республики Казахстан<br>
  от 20 декабря 2012 года № 562<br><br>
  <strong>Форма Р-1</strong>
</div>

<table class="meta-table">
  <tr>
    <td style="width: 85px; padding-top: 2px;">Заказчик</td>
    <td style="padding-right: 20px;">
      <div class="underline-val">
        ${escapeHtml(existing.user?.companyName) || 'Заказчик'},${escapeHtml(customerAddress)}${existing.user?.phone ? `, тел.: ${escapeHtml(existing.user.phone)}` : ''}
      </div>
      <div class="sub-note">полное наименование, адрес, данные о средствах связи</div>
    </td>
    <td style="width: 140px; text-align: center; vertical-align: top;">
      <div style="font-size: 7pt; margin-bottom: 1px;">ИИН/БИН</div>
      <div class="bin-box">
        ${escapeHtml(existing.user?.binIin) || '&nbsp;'}
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 4px;">Исполнитель</td>
    <td style="padding-right: 20px; padding-top: 4px;">
      <div class="underline-val">
        Индивидуальный предприниматель "TORMAG.KZ",Республика Казахстан, индекс 050013, г. Алматы, пр. Нурсултана Назарбаева, д. 187Б, корпус этаж 6, БЦ "STAR", тел.: +7 (707) 711-16-53
      </div>
      <div class="sub-note">полное наименование, адрес, данные о средствах связи</div>
    </td>
    <td style="vertical-align: bottom; padding-bottom: 10px; text-align: center;">
      <div class="bin-box">
        990601301525
      </div>
    </td>
  </tr>
</table>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 8pt;">
  <tr>
    <td style="width: 115px; vertical-align: middle;">Договор (контракт)</td>
    <td style="vertical-align: middle; padding-right: 20px;">
      <span style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 1px; display: inline-block;">
        Публичный договор-оферта № ${escapeHtml(existing.orderNumber)} от ${escapeHtml(orderDateFull)} г.
      </span>
    </td>
    <td style="width: 160px; vertical-align: middle;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; text-align: center; font-size: 7pt;">
        <tr>
          <td style="border: 1px solid #000; padding: 2px 6px;">Номер документа</td>
          <td style="border: 1px solid #000; padding: 2px 6px;">Дата составления</td>
        </tr>
        <tr style="font-weight: bold; font-size: 7.5pt;">
          <td style="border: 1px solid #000; padding: 2px 6px;">${escapeHtml(actNumber)}</td>
          <td style="border: 1px solid #000; padding: 2px 6px;">${escapeHtml(actDateShort)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<div class="title-block">
  АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)
</div>

<table class="items-table">
  <thead>
    <tr>
      <th rowspan="2" style="width: 25px;">Номер по порядку</th>
      <th rowspan="2">Наименование работ (услуг) (в разрезе их подвидов в соответствии с технической спецификацией, заданием, графиком выполнения работ (услуг) при их наличии)</th>
      <th rowspan="2" style="width: 75px;">Дата выполнения работ (оказания услуг)</th>
      <th rowspan="2" style="width: 120px;">Сведения об отчете о научных исследованиях, маркетинговых, консультационных и прочих услугах (дата, номер, количество страниц) (при их наличии)</th>
      <th rowspan="2" style="width: 40px;">Единица измерения</th>
      <th colspan="3">Выполнено работ (оказано услуг)</th>
    </tr>
    <tr>
      <th style="width: 55px;">количество</th>
      <th style="width: 75px;">цена за единицу</th>
      <th style="width: 85px;">стоимость</th>
    </tr>
    <tr style="font-size: 6pt; background-color: #fff;">
      <th>1</th>
      <th>2</th>
      <th>3</th>
      <th>4</th>
      <th>5</th>
      <th>6</th>
      <th>7</th>
      <th>8</th>
    </tr>
  </thead>
  <tbody>
    ${lines
      .map(
        (it, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td class="text-left">${escapeHtml(it.name)}</td>
      <td class="text-center">${escapeHtml(orderDateShort)}</td>
      <td class="text-center">—</td>
      <td class="text-center">${escapeHtml(it.unit)}</td>
      <td class="text-right">${formatQty(it.qty)}</td>
      <td class="text-right">${formatMoney(it.price)}</td>
      <td class="text-right font-bold">${formatMoney(it.sum)}</td>
    </tr>`
      )
      .join('')}

    <tr>
      <td colspan="5" style="border: none; text-align: right; font-weight: bold; padding: 2px 6px;">Итого</td>
      <td class="text-right font-bold" style="border: 1px solid #000;">${formatQty(totalQty)}</td>
      <td class="text-center" style="border: 1px solid #000;">x</td>
      <td class="text-right font-bold" style="border: 1px solid #000;">${formatMoney(finalTotal)}</td>
    </tr>
  </tbody>
</table>

<div class="notes-block">
  <div style="margin-bottom: 3px;">
    Сведения об использовании запасов, полученных от заказчика:
    <span style="border-bottom: 1px solid #000; min-width: 250px; display: inline-block; font-weight: bold;">не использовались</span>
    <div style="font-size: 5.5pt; text-align: center; width: 430px; color: #444; font-style: italic;">наименование, количество, стоимость</div>
  </div>
  <div style="margin-bottom: 3px;">
    Приложение: Перечень документации, в том числе отчет(ы) о маркетинговых, научных исследованиях, консультационных и прочих услугах (обязательны при его (их) наличии) на <span style="border-bottom: 1px solid #000; min-width: 35px; display: inline-block; text-align: center; font-weight: bold;">1</span> страниц
  </div>
  <div style="margin-bottom: 8px;">
    Вышеперечисленные услуги выполнены полностью и в срок. Заказчик претензий по объему, качеству и сроку не имеет.
  </div>
</div>

<table class="signatures-table">
  <tr>
    <td style="width: 48%; vertical-align: top;">
      <div style="margin-bottom: 2px; font-weight: bold;">Сдал (Исполнитель)</div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 45%; border-bottom: 1px solid #000; height: 20px;"></td>
          <td style="width: 10%; text-align: center; vertical-align: bottom;">/</td>
          <td style="width: 45%; border-bottom: 1px solid #000; text-align: center; font-weight: bold; vertical-align: bottom; font-size: 7.5pt;">ИП «TORMAG.KZ»</td>
        </tr>
        <tr style="font-size: 5.5pt; color: #555; text-align: center; font-style: italic;">
          <td>подпись</td>
          <td></td>
          <td>расшифровка подписи</td>
        </tr>
      </table>
      <div class="mp-box">МП</div>
    </td>
    <td style="width: 4%;"></td>
    <td style="width: 48%; vertical-align: top;">
      <div style="display: flex; justify-content: flex-end; margin-bottom: 2px;">
        <span style="font-size: 6.5pt; font-weight: bold;">Руководитель / Представитель</span>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 25%; font-weight: bold; vertical-align: bottom;">Принял (Заказчик)</td>
          <td style="width: 28%; border-bottom: 1px solid #000; height: 20px;"></td>
          <td style="width: 6%; text-align: center; vertical-align: bottom;">/</td>
          <td style="width: 41%; border-bottom: 1px solid #000; height: 20px;"></td>
        </tr>
        <tr style="font-size: 5.5pt; color: #555; text-align: center; font-style: italic;">
          <td></td>
          <td>подпись</td>
          <td></td>
          <td>расшифровка подписи</td>
        </tr>
      </table>
      <div class="mp-box">МП</div>
    </td>
  </tr>
</table>

</body>
</html>`;

    if (req.query.format === 'html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    const pdfBuffer = await renderHtmlToPdf(html, { landscape: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Act_${existing.orderNumber}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Download order act error:', error);
    return res.status(500).json({ message: 'Ошибка формирования Акта выполненных работ: ' + (error.message || error) });
  }
};

export const downloadOrderInvoice = async (req: AuthRequest, res: Response) => {
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


    // Category naming for all 11 KZ goods categories
    const catMap: Record<string, string> = {
      SHOES: 'Обувные товары',
      TEXTILE: 'Товары легкой промышленности (текстиль)',
      MEDICINE: 'Лекарственные препараты',
      WATER: 'Упакованная вода и напитки',
      TOBACCO: 'Табачные изделия',
      BEER: 'Пиво и пивные напитки',
      OILS: 'Моторные масла',
      DIETARY_SUPPLEMENTS: 'Биологически активные добавки (БАД)',
      JEWELRY: 'Ювелирные изделия',
      SAIGA: 'Дериваты рогов сайгака',
      OTHER: 'Потребительские товары',
    };
    const categoryName = catMap[existing.category] || existing.category;

    const stickeringEst = parseStickeringEstimateFromNotes(existing.notes);
    const isOnSite = existing.tariffType === 'STANDARD' || existing.tariffType === 'PRO' || existing.extraServices?.includes('ON_SITE_STICKERING') || Boolean(stickeringEst);

    let baseServiceName = `Услуги по цифровой маркировке и подготовке партии кодов Data Matrix (ИС Танба РК) [Категория: ${categoryName}, Тариф: ${existing.tariffType}]`;
    if (stickeringEst) {
      baseServiceName = `Услуги по выездной оклейке и маркировке партии товаров на складе Заказчика под ключ [Категория: ${categoryName}, бригада: ${stickeringEst.workersCount} чел., срок: ${stickeringEst.daysNeeded} дн., расходные материалы включены]`;
    } else if (isOnSite) {
      baseServiceName = `Услуги по выездной оклейке и маркировке партии товаров на складе Заказчика под ключ [Категория: ${categoryName}, Тариф: ${existing.tariffType}]`;
    }

    interface InvoiceLineItem {
      name: string;
      unit: string;
      qty: number;
      price: number;
      sum: number;
    }

    const lines: InvoiceLineItem[] = [];
    const baseSum = existing.itemsCount * existing.pricePerItem;
    lines.push({
      name: baseServiceName,
      unit: 'шт.',
      qty: existing.itemsCount,
      price: existing.pricePerItem,
      sum: baseSum,
    });

    if (existing.extraServices?.includes('STICKER_LAYOUT_DESIGN')) {
      lines.push({
        name: 'Разработка индивидуального дизайна макета термоэтикетки по ТЗ Заказчика (СТ РК / ГОСТ)',
        unit: 'усл.',
        qty: 1,
        price: 5000,
        sum: 5000,
      });
    }

    if (existing.ssccNeeded) {
      const isPro = existing.tariffType === 'PRO';
      lines.push({
        name: 'Услуги агрегации в групповые короба и паллеты (коды SSCC)',
        unit: 'шт.',
        qty: existing.itemsCount,
        price: isPro ? 0 : 5,
        sum: isPro ? 0 : existing.itemsCount * 5,
      });
    }

    if (existing.extraServices?.includes('URGENT_PROCESSING')) {
      const urgentSum = Math.round(baseSum * 0.2);
      lines.push({
        name: 'Срочное приоритетное исполнение партии кодов (24 часа) (+20%)',
        unit: 'усл.',
        qty: 1,
        price: urgentSum,
        sum: urgentSum,
      });
    }

    if (existing.extraServices?.includes('EXPRESS_DELIVERY')) {
      lines.push({
        name: 'Курьерская доставка партии готовых стикеров на склад Заказчика по РК',
        unit: 'усл.',
        qty: 1,
        price: 15000,
        sum: 15000,
      });
    }

    const calculatedSum = lines.reduce((acc, it) => acc + it.sum, 0);
    const finalTotal = existing.totalPrice || calculatedSum;
    if (lines.length > 0 && calculatedSum !== finalTotal) {
      const otherSums = lines.slice(1).reduce((acc, it) => acc + it.sum, 0);
      lines[0].sum = Math.max(0, finalTotal - otherSums);
      lines[0].price = lines[0].qty > 0 ? Math.round((lines[0].sum / lines[0].qty) * 100) / 100 : lines[0].price;
    }
    const amountInWords = numberToWordsTenge(finalTotal);

    let customerAddress = 'Республика Казахстан';
    if (existing.notes) {
      const addrMatch = existing.notes.match(/Адрес склада(?: в РК)?:?\s*([^\n;]+)/i);
      if (addrMatch && addrMatch[1]?.trim()) {
        customerAddress = addrMatch[1].trim();
      }
    }

    const monthsGenitive = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const createdDateObj = new Date(existing.createdAt);
    const orderDateFull = `${createdDateObj.getDate()} ${monthsGenitive[createdDateObj.getMonth()]} ${createdDateObj.getFullYear()}`;
    const invoiceNumber = existing.orderNumber.replace(/^[^\d]*-?/, '') || existing.orderNumber;

    const formatMoney = (n: number) => {
      const parts = n.toFixed(2).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return `${parts[0]},${parts[1]}`;
    };
    const formatQty = (n: number) => {
      const parts = n.toFixed(3).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return `${parts[0]},${parts[1]}`;
    };

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Счет на оплату № ${escapeHtml(invoiceNumber)} от ${escapeHtml(orderDateFull)} г.</title>
<style>
  @page {
    size: A4 portrait;
    margin: 8mm 12mm 8mm 12mm;
  }
  body {
    font-family: Arial, sans-serif;
    margin: 15px 25px;
    color: #000;
    font-size: 8pt;
    line-height: 1.3;
    background-color: #fff;
  }
  .top-notice {
    font-size: 7.5pt;
    line-height: 1.35;
    text-align: center;
    margin-bottom: 16px;
    color: #000;
  }
  .sample-title {
    font-size: 8.5pt;
    font-weight: bold;
    margin-bottom: 2px;
  }
  .bank-table {
    width: 100%;
    border-collapse: collapse;
    border: 2px solid #000;
    margin-bottom: 18px;
    font-size: 8pt;
  }
  .bank-table td {
    border: 1px solid #000;
    padding: 3px 6px;
    vertical-align: top;
  }
  .header-title {
    font-size: 13pt;
    font-weight: bold;
    border-bottom: 2px solid #000;
    padding-bottom: 4px;
    margin-bottom: 12px;
  }
  .parties-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    font-size: 8pt;
  }
  .parties-table td {
    padding: 2px 0;
    vertical-align: top;
  }
  .label-col {
    width: 85px;
    color: #000;
  }
  .items-table {
    width: 100%;
    border-collapse: collapse;
    border: 2px solid #000;
    margin-bottom: 4px;
    font-size: 7.5pt;
  }
  .items-table th, .items-table td {
    border: 1px solid #000;
    padding: 2px 4px;
  }
  .items-table th {
    font-weight: bold;
    text-align: center;
    background-color: #fff;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .totals-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 2px;
    font-size: 8pt;
  }
  .totals-table td {
    padding: 2px 4px;
  }
  .summary-text {
    font-size: 8pt;
    margin-top: 12px;
    line-height: 1.4;
  }
  .divider-line {
    border-bottom: 2px solid #000;
    margin: 10px 0 20px 0;
  }
  .signatures-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-size: 8.5pt;
    font-weight: bold;
  }
</style>
</head>
<body>

<div class="top-notice">
  Внимание! Оплата данного счёта означает согласие с условиями Публичного договора-оферты на оказание услуг маркировки товаров (tanbox.kz). Уведомление об оплате обязательно. Услуги оказываются по факту поступления денежных средств на расчетный счет Исполнителя. По факту оказания услуг оформляется первичный Акт выполненных работ (форма Р-1).
</div>

<div class="sample-title">Образец платежного поручения</div>
<table class="bank-table">
  <tr>
    <td style="width: 58%;">
      <div style="font-size: 7.5pt;">Бенефициар:</div>
      <div style="font-weight: bold; font-size: 8.5pt;">Индивидуальный предприниматель "TORMAG.KZ"</div>
      <div style="font-size: 7.5pt;">БИН / ИИН: 990601301525</div>
    </td>
    <td style="width: 27%; text-align: center; vertical-align: middle;">
      <div style="font-size: 7.5pt;">ИИК</div>
      <div style="font-weight: bold; font-size: 8pt;">(счет Kaspi Pay)</div>
    </td>
    <td style="width: 15%; text-align: center; vertical-align: middle;">
      <div style="font-size: 7.5pt;">Кбе</div>
      <div style="font-weight: bold; font-size: 8pt;">19</div>
    </td>
  </tr>
  <tr>
    <td>
      <div style="font-size: 7.5pt;">Банк бенефициара:</div>
      <div style="font-weight: bold; font-size: 8.5pt;">АО "Kaspi Bank" (Kaspi Pay)</div>
    </td>
    <td style="text-align: center; vertical-align: middle;">
      <div style="font-size: 7.5pt;">БИК</div>
      <div style="font-weight: bold; font-size: 8pt;">CASPKZKZ</div>
    </td>
    <td style="text-align: center; vertical-align: middle;">
      <div style="font-size: 7.5pt;">Код назначения платежа</div>
      <div style="font-weight: bold; font-size: 8pt;">859</div>
    </td>
  </tr>
</table>

<div class="header-title">
  Счет на оплату № ${escapeHtml(invoiceNumber)} от ${escapeHtml(orderDateFull)} г.
</div>

<table class="parties-table">
  <tr>
    <td class="label-col">Поставщик:</td>
    <td style="font-weight: bold;">
      БИН / ИИН 990601301525,Индивидуальный предприниматель "TORMAG.KZ",Республика Казахстан, индекс 050013, г. Алматы, пр. Нурсултана Назарбаева, д. 187Б, корпус этаж 6, БЦ "STAR"
    </td>
  </tr>
  <tr>
    <td class="label-col">Покупатель:</td>
    <td style="font-weight: bold;">
      БИН / ИИН ${escapeHtml(existing.user?.binIin) || '—'},${escapeHtml(existing.user?.companyName) || 'Заказчик'},${escapeHtml(customerAddress)}
    </td>
  </tr>
  <tr>
    <td class="label-col">Договор:</td>
    <td style="font-weight: bold;">
      Публичный договор-оферта на оказание услуг маркировки № ${escapeHtml(existing.orderNumber)} от ${escapeHtml(orderDateFull)} г.
    </td>
  </tr>
</table>

<table class="items-table">
  <thead>
    <tr>
      <th style="width: 25px;">№</th>
      <th style="width: 85px;">Код</th>
      <th>Наименование</th>
      <th style="width: 60px;">Кол-во</th>
      <th style="width: 35px;">Ед.</th>
      <th style="width: 75px;">Цена</th>
      <th style="width: 85px;">Сумма</th>
    </tr>
  </thead>
  <tbody>
    ${lines
      .map(
        (it, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td class="text-center">${String(idx + 1).padStart(11, '0')}</td>
      <td>${escapeHtml(it.name)}</td>
      <td class="text-right">${formatQty(it.qty)}</td>
      <td class="text-center">${escapeHtml(it.unit)}</td>
      <td class="text-right">${formatMoney(it.price)}</td>
      <td class="text-right">${formatMoney(it.sum)}</td>
    </tr>`
      )
      .join('')}
  </tbody>
</table>

<table class="totals-table">
  <tr>
    <td style="text-align: right; font-weight: bold; width: 85%;">Итого:</td>
    <td style="text-align: right; font-weight: bold; width: 15%;">${formatMoney(finalTotal)}</td>
  </tr>
  <tr>
    <td style="text-align: right; font-weight: bold;">В том числе НДС:</td>
    <td style="text-align: right; font-weight: bold;">Без НДС</td>
  </tr>
</table>

<div class="summary-text">
  <div>Всего наименований ${lines.length}, на сумму ${formatMoney(finalTotal)} теңге</div>
  <div><strong>Всего к оплате: ${escapeHtml(amountInWords)}</strong></div>
</div>

<div class="divider-line"></div>

<div class="signatures-row">
  <div>Исполнитель</div>
  <div style="display: flex; align-items: flex-end; gap: 20px;">
    <div style="width: 180px; border-bottom: 1px solid #000;"></div>
    <div>/ИП «TORMAG.KZ»/</div>
  </div>
</div>

</body>
</html>`;

    if (req.query.format === 'html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    const pdfBuffer = await renderHtmlToPdf(html, { landscape: false });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice_${existing.orderNumber}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Download order invoice error:', error);
    return res.status(500).json({ message: 'Ошибка формирования Счёта на оплату: ' + (error.message || error) });
  }
};

export const ensureOrderCodesPopulated = async (orderId: string): Promise<number> => {
  const count = await prisma.orderCodeItem.count({ where: { orderId } });
  if (count > 0) return count;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, itemsCount: true, codesFileUrl: true, notes: true },
  });
  if (!order || !order.codesFileUrl) return 0;

  const filePath = path.resolve(process.cwd(), '.' + order.codesFileUrl);
  if (!fs.existsSync(filePath)) return 0;

  try {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const { rows } = parseCodesFile(rawContent);
    if (rows.length > 0) {
      const fileCodes: string[] = [];
      const seen = new Set<string>();
      for (const r of rows) {
        const c = (r.code || Object.values(r)[0] || '').trim();
        if (c && !seen.has(c)) {
          seen.add(c);
          fileCodes.push(c);
        }
      }

      // Check for codes that already exist in OTHER orders
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
      return items.length;
    }
  } catch (err) {
    console.warn('Error reading codes file in ensureOrderCodesPopulated:', err);
  }

  return 0;
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

    await ensureOrderCodesPopulated(existing.id);

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

export const getCodesRegistry = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit), 10) || 50));
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const orderId = typeof req.query.orderId === 'string' ? req.query.orderId.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';

    const isClient = req.user.role !== 'ADMIN';

    // 1. Ensure orders in scope have codes populated if empty
    if (isClient) {
      const userOrders = await prisma.order.findMany({
        where: { userId: req.user.id },
        select: { id: true },
      });
      for (const ord of userOrders) {
        await ensureOrderCodesPopulated(ord.id);
      }
    } else if (orderId) {
      await ensureOrderCodesPopulated(orderId);
    } else {
      // Auto-populate for any empty order in system (first 10)
      const emptyOrders = await prisma.order.findMany({
        where: { codeItems: { none: {} } },
        select: { id: true },
        take: 10,
      });
      for (const ord of emptyOrders) {
        await ensureOrderCodesPopulated(ord.id);
      }
    }

    // Build Prisma query condition
    const where: any = {};
    const orderWhere: any = {};

    if (isClient) {
      orderWhere.userId = req.user.id;
    } else if (userId) {
      orderWhere.userId = userId;
    }

    if (orderId) {
      where.orderId = orderId;
    }

    if (category) {
      orderWhere.category = category as any;
    }

    if (Object.keys(orderWhere).length > 0) {
      where.order = orderWhere;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      const searchNum = parseInt(search, 10);
      const orConditions: any[] = [
        { code: { contains: search, mode: 'insensitive' } },
        { gtin: { contains: search } },
        { serial: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
      ];
      if (!isNaN(searchNum)) {
        orConditions.push({ index: searchNum });
      }
      if (!isClient) {
        orConditions.push({ order: { user: { companyName: { contains: search, mode: 'insensitive' } } } });
        orConditions.push({ order: { user: { binIin: { contains: search } } } });
      }
      where.OR = orConditions;
    }

    // Query paginated items and stats
    const [total, items, totalPrinted] = await Promise.all([
      prisma.orderCodeItem.count({ where }),
      prisma.orderCodeItem.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              category: true,
              tariffType: true,
              status: true,
              printAllowed: true,
              itemsCount: true,
              stickerLayout: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  companyName: true,
                  binIin: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: [{ order: { createdAt: 'desc' } }, { index: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.orderCodeItem.count({
        where: {
          ...where,
          status: { in: ['PRINTED', 'REPRINTED'] },
        },
      }),
    ]);

    // Available orders for filter dropdown
    const availableOrders = await prisma.order.findMany({
      where: isClient ? { userId: req.user.id } : {},
      select: {
        id: true,
        orderNumber: true,
        category: true,
        itemsCount: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Available clients for admin filter dropdown
    let availableClients: any[] = [];
    if (!isClient) {
      availableClients = await prisma.user.findMany({
        where: { role: 'CLIENT' },
        select: {
          id: true,
          companyName: true,
          binIin: true,
          email: true,
        },
        orderBy: { companyName: 'asc' },
      });
    }

    return res.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      limit,
      stats: {
        totalCodes: total,
        printedCodes: totalPrinted,
        newCodes: total - totalPrinted,
        totalOrders: availableOrders.length,
      },
      availableOrders,
      availableClients,
    });
  } catch (error: any) {
    console.error('Get codes registry error:', error);
    return res.status(500).json({ message: 'Ошибка получения реестра кодов маркировки' });
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

    const isSample = req.query.sample === 'true' || req.query.sample === '1';
    if (req.user.role !== 'ADMIN' && !isSample) {
      const hasDesignService = Array.isArray(existing.extraServices) && existing.extraServices.includes('STICKER_LAYOUT_DESIGN');
      if (hasDesignService && existing.stickerApprovalStatus !== 'APPROVED') {
        return res.status(403).json({
          message: 'Печать заблокирована: индивидуальный макет этикетки ещё не согласован. Сначала согласуйте макет.',
        });
      }

      const isPrintAllowed = (existing as any).printAllowed === true || (existing as any).paymentStatus === 'PAID';
      if (!isPrintAllowed) {
        return res.status(403).json({
          message: 'Печать заблокирована: ожидается подтверждение оплаты и разрешение администратора.',
        });
      }
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

    if (templateElements.length === 0 && existing.templateId) {
      const savedTpl = await prisma.userStickerTemplate.findUnique({
        where: { id: existing.templateId },
      });
      if (savedTpl && Array.isArray(savedTpl.elements) && savedTpl.elements.length > 0) {
        templateElements = savedTpl.elements as any[];
        w = savedTpl.widthMm;
        h = savedTpl.heightMm;
      }
    }

    if (templateElements.length === 0) {
      templateElements = [
        {
          id: 'def-dm',
          type: 'datamatrix',
          x: 4,
          y: 5,
          size: 26,
          columnName: 'code',
        },
        {
          id: 'def-num',
          type: 'text',
          x: 4,
          y: 33,
          width: 50,
          content: '№ {number}  |  Заказ {orderNumber}',
          fontSize: 7,
          fontWeight: 'bold',
          align: 'left',
        },
        {
          id: 'def-gtin',
          type: 'text',
          x: 31,
          y: 6,
          width: 25,
          content: 'GTIN: {gtin}',
          fontSize: 6,
          fontWeight: 'normal',
          align: 'left',
        },
        {
          id: 'def-serial',
          type: 'text',
          x: 31,
          y: 12,
          width: 25,
          content: 'SN: {serial}',
          fontSize: 6,
          fontWeight: 'normal',
          align: 'left',
        },
      ];
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

    const filename = `Label_Item_${idx}_${existing.orderNumber}.pdf`;
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

    if (req.user.role !== 'ADMIN') {
      const hasDesignService = Array.isArray(existing.extraServices) && existing.extraServices.includes('STICKER_LAYOUT_DESIGN');
      if (hasDesignService && existing.stickerApprovalStatus !== 'APPROVED') {
        return res.status(403).json({
          message: 'Печать диапазона заблокирована: индивидуальный макет этикетки ещё не согласован.',
        });
      }

      const isPrintAllowed = (existing as any).printAllowed === true || (existing as any).paymentStatus === 'PAID';
      if (!isPrintAllowed) {
        return res.status(403).json({
          message: 'Печать диапазона заблокирована: ожидается подтверждение оплаты и разрешение администратора.',
        });
      }
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

    if (templateElements.length === 0 && existing.templateId) {
      const savedTpl = await prisma.userStickerTemplate.findUnique({
        where: { id: existing.templateId },
      });
      if (savedTpl && Array.isArray(savedTpl.elements) && savedTpl.elements.length > 0) {
        templateElements = savedTpl.elements as any[];
        w = savedTpl.widthMm;
        h = savedTpl.heightMm;
      }
    }

    if (templateElements.length === 0) {
      templateElements = [
        {
          id: 'def-dm',
          type: 'datamatrix',
          x: 4,
          y: 5,
          size: 26,
          columnName: 'code',
        },
        {
          id: 'def-num',
          type: 'text',
          x: 4,
          y: 33,
          width: 50,
          content: '№ {number}  |  Заказ {orderNumber}',
          fontSize: 7,
          fontWeight: 'bold',
          align: 'left',
        },
        {
          id: 'def-gtin',
          type: 'text',
          x: 31,
          y: 6,
          width: 25,
          content: 'GTIN: {gtin}',
          fontSize: 6,
          fontWeight: 'normal',
          align: 'left',
        },
        {
          id: 'def-serial',
          type: 'text',
          x: 31,
          y: 12,
          width: 25,
          content: 'SN: {serial}',
          fontSize: 6,
          fontWeight: 'normal',
          align: 'left',
        },
      ];
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

    const queueKey = `order_${existing.id}_range_${fromIdx}_${toIdx}`;
    const taskDesc = `Заказ ${existing.orderNumber} - Диапазон ${fromIdx}-${toIdx} (${rows.length} шт.)`;
    const buffer = await pdfQueue.enqueue(queueKey, taskDesc, () =>
      requestLabelGeneratorPdf({ template, csvData: rows })
    );

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

export const getPdfQueueStatus = async (req: AuthRequest, res: Response) => {
  return res.json(pdfQueue.getStats());
};

export const updateOrderStickeringEstimate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Доступ разрешен только администратору' });
    }

    const { id } = req.params;
    const {
      clientPricePerUnit,
      totalPrice,
      workersCount,
      daysNeeded,
      manHours,
      warehouseConditionTitle,
      tapeRollsNeeded,
      stretchRollsNeeded,
    } = req.body;

    const price = parseFloat(String(clientPricePerUnit));
    const total = parseFloat(String(totalPrice));

    if (isNaN(price) || price <= 0 || isNaN(total) || total <= 0) {
      return res.status(400).json({ message: 'Некорректная стоимость или тариф сметы' });
    }

    const existing = await findOrderByIdOrNumber(id);
    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    // Format confirmed estimate block
    const dateStr = new Date().toLocaleDateString('ru-RU');
    const newBlock = [
      '=== УТВЕРЖДЕННАЯ СМЕТА ВЫЕЗДНОЙ ОКЛЕЙКИ ===',
      `Дата расчета: ${dateStr}`,
      `Бригада: ${workersCount || 1} чел.`,
      `Срок выполнения: ${daysNeeded || 1} раб. дн. (~${(manHours || 0).toFixed(1)} чел.-ч.)`,
      warehouseConditionTitle ? `Условия склада: ${warehouseConditionTitle}` : '',
      `Тариф оклейки: ${price} ₸/шт.`,
      `Расходные материалы: скотч ${tapeRollsNeeded || 0} рул., стрейч-пленка ${stretchRollsNeeded || 0} рул.`,
      `Итоговая стоимость: ${total.toLocaleString('ru-RU')} ₸`,
      '===========================================',
    ].filter(Boolean).join('\n');

    let updatedNotes = existing.notes || '';
    if (/=== УТВЕРЖДЕННАЯ СМЕТА ВЫЕЗДНОЙ ОКЛЕЙКИ ===[\s\S]*?(?:={20,}|$)/i.test(updatedNotes)) {
      updatedNotes = updatedNotes.replace(/=== УТВЕРЖДЕННАЯ СМЕТА ВЫЕЗДНОЙ ОКЛЕЙКИ ===[\s\S]*?(?:={20,}|$)/i, newBlock);
    } else {
      updatedNotes = updatedNotes ? `${updatedNotes}\n\n${newBlock}` : newBlock;
    }

    const updatedServices = Array.from(new Set([...(existing.extraServices || []), 'ON_SITE_STICKERING']));

    const updated = await prisma.order.update({
      where: { id: existing.id },
      data: {
        pricePerItem: price,
        totalPrice: total,
        extraServices: updatedServices,
        notes: updatedNotes,
      },
      include: {
        user: true,
      },
    });

    return res.json({
      success: true,
      message: 'Смета выезда успешно отправлена в заказ и обновлена',
      order: updated,
    });
  } catch (err: any) {
    console.error('Update stickering estimate error:', err);
    return res.status(500).json({ message: 'Ошибка при сохранении сметы: ' + err.message });
  }
};



