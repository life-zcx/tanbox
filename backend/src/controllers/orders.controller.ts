import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { OrderCategory, TariffType, OrderStatus, PaymentStatus, StickerApprovalStatus, CodeItemStatus } from '@prisma/client';
import { computeOrderPricing } from '../utils/pricing';
import { pdfQueue } from '../services/pdfQueue.service';
import { renderHtmlToPdf } from '../services/pdfRenderer.service';
import { getClientOrderStartIndex, reindexClientOrders } from '../utils/orderNumbering';
import { parseCodesFile, ensureOrderCodesPopulated } from '../services/orderCodes.service';
import { 
  generateOrderActHtml, 
  generateOrderInvoiceHtml, 
  renderOrderActPdf, 
  renderOrderInvoicePdf, 
  parseStickeringEstimateFromNotes 
} from '../services/orderDocuments.service';
import { getDefaultStickerLayout } from '../utils/stickerLayout.utils';
export { getDefaultStickerLayout };

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

    let extractedAddress: string | null = null;
    if (typeof req.body.warehouseAddress === 'string' && req.body.warehouseAddress.trim().length > 0) {
      extractedAddress = req.body.warehouseAddress.trim();
    } else if (typeof notes === 'string') {
      const match = notes.match(/Адрес склада[:\s]*([^\n\r]+)/i);
      if (match) {
        extractedAddress = match[1].trim();
      }
    }

    if (!extractedAddress && !(typeof notes === 'string' && /Адрес склада/i.test(notes))) {
      return res.status(400).json({ message: 'Пожалуйста, укажите адрес склада в РК' });
    }

    // Authoritative server-side price calculation (tamper-proof)
    const pricing = await computeOrderPricing({
      tariffType: tariffType as TariffType,
      itemsCount: countNum,
      extraServices: Array.isArray(extraServices) ? extraServices.map(String) : [],
      ssccNeeded: Boolean(ssccNeeded),
    });

    // Find starting order sequence number
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true },
    });
    let baseNum = 1;
    if (lastOrder?.orderNumber) {
      const match = lastOrder.orderNumber.match(/\d+/);
      if (match) {
        baseNum = parseInt(match[0], 10) + 1;
      }
    } else {
      const count = await prisma.order.count();
      baseNum = count + 1;
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
    let initialApprovalStatus: StickerApprovalStatus = StickerApprovalStatus.APPROVED;
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
        initialApprovalStatus = StickerApprovalStatus.APPROVED;
        resolvedTemplateId = template.id;
        stickerWidth = template.widthMm;
        stickerHeight = template.heightMm;
      }
    }

    // 2. If client passed explicit layout elements from frontend
    if (!initialLayout && customStickerLayout && Array.isArray(customStickerLayout.elements) && customStickerLayout.elements.length > 0) {
      initialLayout = customStickerLayout;
      initialApprovalStatus = StickerApprovalStatus.APPROVED;
      stickerWidth = customStickerLayout.widthMm || stickerWidth;
      stickerHeight = customStickerLayout.heightMm || stickerHeight;
    }

    // 3. If client ordered paid custom design service (+5 000 ₸)
    if (!initialLayout && hasRequestedDesignService) {
      initialLayout = { widthMm: stickerWidth || 58, heightMm: stickerHeight || 40, elements: [] };
      initialApprovalStatus = StickerApprovalStatus.IN_DESIGN;
    }

    // 4. Default standard auto-generated layout
    if (!initialLayout) {
      initialLayout = getDefaultStickerLayout(stickerWidth || 58, stickerHeight || 40, req.user.companyName);
      initialApprovalStatus = StickerApprovalStatus.APPROVED;
    }

    // Sanitize user-provided notes against tampering with official admin estimate blocks
    let sanitizedNotes = typeof notes === 'string' ? notes.slice(0, 5000) : '';
    sanitizedNotes = sanitizedNotes.replace(/=== УТВЕРЖДЕННАЯ СМЕТА ВЫЕЗДНОЙ ОКЛЕЙКИ ===[\s\S]*?(?:={20,}|$)/gi, '').trim();

    // Atomic collision-resistant order creation with automatic retry
    let newOrder: any = null;
    let attempts = 0;
    while (!newOrder && attempts < 10) {
      const candidateNum = baseNum + attempts;
      const orderNumber = `TB-${candidateNum.toString().padStart(4, '0')}`;
      attempts++;

      try {
        newOrder = await prisma.order.create({
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
            notes: sanitizedNotes,
            status: OrderStatus.NEW,
            templateId: resolvedTemplateId,
            stickerLayout: initialLayout,
            stickerApprovalStatus: initialApprovalStatus,
            warehouseAddress: extractedAddress,
          },
        });
      } catch (err: any) {
        if (err.code === 'P2002') {
          // Unique constraint collision on orderNumber, retry with incremented candidate
          continue;
        }
        throw err;
      }
    }

    if (!newOrder) {
      throw new Error('Не удалось сгенерировать уникальный номер заказа, попробуйте еще раз');
    }

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

    const orderIds = orders.map((o) => o.id);
    const ranges = await prisma.orderCodeItem.groupBy({
      by: ['orderId'],
      where: { orderId: { in: orderIds } },
      _min: { index: true },
      _max: { index: true },
    });
    const rangeMap = new Map<string, { min: number; max: number }>();
    for (const r of ranges) {
      if (r._min.index !== null && r._max.index !== null) {
        rangeMap.set(r.orderId, { min: r._min.index, max: r._max.index });
      }
    }

    const enhancedOrders = orders.map((o) => {
      const r = rangeMap.get(o.id);
      return {
        ...o,
        startLabelNumber: r?.min || null,
        endLabelNumber: r?.max || null,
        labelRange: r ? `№ ${r.min} — № ${r.max}` : null,
      };
    });

    return res.json(enhancedOrders);
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

    const firstItem = await prisma.orderCodeItem.findFirst({
      where: { orderId: order.id },
      orderBy: { index: 'asc' },
      select: { index: true },
    });
    const lastItem = await prisma.orderCodeItem.findFirst({
      where: { orderId: order.id },
      orderBy: { index: 'desc' },
      select: { index: true },
    });

    const startLabelNumber = firstItem?.index || null;
    const endLabelNumber = lastItem?.index || null;

    return res.json({
      ...order,
      startLabelNumber,
      endLabelNumber,
      labelRange: startLabelNumber && endLabelNumber ? `№ ${startLabelNumber} — № ${endLabelNumber}` : null,
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
        ...(paymentStatus && Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)
          ? { paymentStatus: paymentStatus as PaymentStatus }
          : {}),
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
        ...(paymentStatus && Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)
          ? { paymentStatus: paymentStatus as PaymentStatus }
          : {}),
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

    // Protection: clients cannot alter codes if order is already paid or in production workflow
    if (req.user.role !== 'ADMIN') {
      if (['PROCESSING', 'PRINTING', 'STICKERING', 'COMPLETED', 'CANCELLED'].includes(existing.status)) {
        if (req.file && fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch {}
        }
        return res.status(400).json({
          message: 'Невозможно прикрепить новый файл: заказ уже находится в обработке или завершен.',
        });
      }
      if (existing.paymentStatus === 'PAID') {
        if (req.file && fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch {}
        }
        return res.status(400).json({
          message: 'Невозможно прикрепить новый файл: данный заказ уже оплачен. Для изменения обратитесь к менеджеру.',
        });
      }
    }

    const rawContent = await fs.promises.readFile(req.file.path, 'utf-8');
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
    await fs.promises.writeFile(targetFilePath, cleanedFileContent, 'utf-8');

    if (req.file.path !== targetFilePath && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }

    const relativeUrl = `/uploads/orders/${existing.id}/${req.file.filename}`;

    // Authoritative server-side price recalculation with the updated codes count
    const newItemsCount = acceptedItems.length;
    const pricing = await computeOrderPricing({
      tariffType: existing.tariffType,
      itemsCount: newItemsCount,
      extraServices: existing.extraServices,
      ssccNeeded: existing.ssccNeeded,
    });

    const updatedOrder = await prisma.order.update({
      where: { id: existing.id },
      data: {
        codesFileUrl: relativeUrl,
        codesFileName: req.file.originalname,
        itemsCount: newItemsCount,
        pricePerItem: pricing.unitPrice,
        totalPrice: pricing.totalPrice,
        pdfUrl: null,
        printAllowed: false,
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
      const startIndex = await getClientOrderStartIndex(existing.userId, existing.id, existing.createdAt);
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
          index: startIndex + idx,
          code: item.code,
          gtin,
          serial,
          status: CodeItemStatus.NEW,
        };
      });

      const BATCH_SIZE = 2000;
      for (let b = 0; b < items.length; b += BATCH_SIZE) {
        await prisma.orderCodeItem.createMany({ data: items.slice(b, b + BATCH_SIZE) });
      }

      // Reindex client orders to guarantee unbroken numbering sequence across all orders
      await reindexClientOrders(existing.userId);
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

    const rawContent = await fs.promises.readFile(req.file.path, 'utf-8');
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
      message,
    });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    console.error('Check codes file error:', error);
    return res.status(500).json({ message: 'Ошибка при проверке файла кодов маркировки' });
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
    const rawContent = await fs.promises.readFile(filePath, 'utf-8');
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
          const raw = await fs.promises.readFile(csvPath, 'utf-8');
          const parsed = parseCodesFile(raw);
          const startIndex = await getClientOrderStartIndex(existing.userId, existing.id, existing.createdAt);
          rows = parsed.rows.map((r, idx) => ({
            barcode: orderBarcode || '',
            ...r,
            index: String(startIndex + idx),
            number: String(startIndex + idx),
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
        const startIndex = await getClientOrderStartIndex(existing.userId, existing.id, existing.createdAt);
        rows = [
          {
            code: `010487000000000021${String(existing.orderNumber).replace(/\D/g, '')}0001\u001d91FFD0\u001d92dGVzdA==`,
            barcode: orderBarcode || '2000000000018',
            brand: existing.user?.companyName || 'TANBOX TEST',
            article: existing.orderNumber,
            index: String(startIndex),
            number: String(startIndex),
          },
        ];
      } else if (req.user.role === 'ADMIN') {
        // If admin generates batch for order where codes file not attached yet, generate full order count
        const startIndex = await getClientOrderStartIndex(existing.userId, existing.id, existing.createdAt);
        rows = Array.from({ length: existing.itemsCount }, (_, i) => ({
          code: `010460000000000021${String(existing.orderNumber).replace(/\D/g, '')}${String(i + 1).padStart(5, '0')}\u001d91FFD0\u001d92dGVzdA==`,
          barcode: orderBarcode || `20000000${String(i + 1).padStart(5, '0')}`,
          brand: existing.user?.companyName || 'Бренд',
          article: existing.orderNumber,
          index: String(startIndex + i),
          number: String(startIndex + i),
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

    if (req.query.format === 'html') {
      const html = generateOrderActHtml(existing);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    const pdfBuffer = await renderOrderActPdf(existing);
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

    if (req.query.format === 'html') {
      const html = generateOrderInvoiceHtml(existing);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    const pdfBuffer = await renderOrderInvoicePdf(existing);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice_${existing.orderNumber}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Download order invoice error:', error);
    return res.status(500).json({ message: 'Ошибка формирования Счёта на оплату' });
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
      items: items.map((it) => ({ ...it, id: `${it.orderId}_${it.index}` })),
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
      const emptyUserOrders = await prisma.order.findMany({
        where: {
          userId: req.user.id,
          codeItems: { none: {} },
          codesFileUrl: { not: null },
        },
        select: { id: true },
        take: 5,
      });
      for (const ord of emptyUserOrders) {
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
      items: items.map((it) => ({ ...it, id: `${it.orderId}_${it.index}` })),
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
      where: { orderId_index: { orderId: existing.id, index: item.index } },
      data: { status: CodeItemStatus.REPRINTED, printedAt: new Date() },
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
      data: { status: CodeItemStatus.REPRINTED, printedAt: new Date() },
    });

    const filename = `Labels_(${fromIdx}-${toIdx})_${existing.orderNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error: any) {
    console.error('Download range items PDF error:', error);
    return res.status(500).json({ message: 'Ошибка при генерации диапазона этикеток' });
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
        stickeringEstimate: {
          clientPricePerUnit: price,
          totalPrice: total,
          workersCount: workersCount || 1,
          daysNeeded: daysNeeded || 1,
          manHours: manHours || 0,
          warehouseConditionTitle: warehouseConditionTitle || '',
          tapeRollsNeeded: tapeRollsNeeded || 0,
          stretchRollsNeeded: stretchRollsNeeded || 0,
          calculatedAt: new Date().toISOString(),
        },
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
    return res.status(500).json({ message: 'Ошибка при сохранении сметы' });
  }
};



