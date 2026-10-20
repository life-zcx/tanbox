import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { InvoiceStatus, OnlinePaymentStatus, OnlinePaymentType, PaymentStatus } from '@prisma/client';
import { renderCustomInvoicePdf, generateCustomInvoiceHtml } from '../services/orderDocuments.service';
import { clientTelegramBot } from '../services/clientTelegram.service';
import { logger } from '../utils/logger';
import { advanceOrderStatus } from '../utils/orderLifecycle';

/**
 * Auto-synchronizes orders with Invoice records.
 * If an order doesn't have an Invoice yet, it creates one so that clients see invoices for all their orders.
 */
export async function syncOrderInvoices(userId?: string) {
  try {
    // Only query orders that do NOT have an invoice yet (O(1) index lookup instead of full DB table scan)
    const ordersWithoutInvoices = await prisma.order.findMany({
      where: {
        ...(userId ? { userId } : {}),
        invoices: { none: {} },
      },
      include: {
        user: true,
      },
    });

    for (const order of ordersWithoutInvoices) {
      const numPart = String(order.orderNumber).replace(/\D/g, '') || '0001';
      const invoiceNumber = `СЧ-${numPart.padStart(4, '0')}`;

      // Ensure uniqueness
      const existingByNum = await prisma.invoice.findFirst({
        where: { invoiceNumber },
      });
      const finalNumber = existingByNum ? `СЧ-${order.orderNumber}` : invoiceNumber;

      const tariffLabel = order.tariffType === 'DIGITAL'
        ? 'Цифровой'
        : order.tariffType === 'PRINT'
        ? 'Печать'
        : order.tariffType === 'STANDARD'
        ? 'Стандарт'
        : order.tariffType === 'PRO'
        ? 'Про'
        : order.tariffType;

      const itemTitle = `Услуги маркировки и генерации кодов Data Matrix (${order.category}) — Тариф «${tariffLabel}»`;

      const invoiceStatus: InvoiceStatus =
        order.paymentStatus === 'PAID'
          ? 'PAID'
          : order.status === 'CANCELLED'
          ? 'CANCELLED'
          : 'PENDING';

      await prisma.invoice.create({
        data: {
          invoiceNumber: finalNumber,
          date: order.createdAt,
          status: invoiceStatus,
          userId: order.userId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.user?.companyName || 'Клиент',
          customerBinIin: order.user?.binIin || '—',
          customerAddress: order.warehouseAddress || 'г. Алматы',
          customerPhone: order.user?.phone || null,
          totalAmount: order.totalPrice,
          notes: order.notes || null,
          items: {
            create: [
              {
                index: 1,
                name: itemTitle,
                unit: 'шт.',
                quantity: order.itemsCount,
                price: order.pricePerItem,
                totalPrice: order.totalPrice,
              },
            ],
          },
        },
      });
    }
  } catch (syncErr) {
    logger.warn(`Failed to auto-sync order invoices: ${syncErr}`);
  }
}

/**
 * GET /api/invoices
 * Lists invoices. Admins get all (with filters); Clients get only their own.
 */
export async function getInvoices(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    // Auto-sync missing invoices for user's orders before returning
    await syncOrderInvoices(user.role === 'ADMIN' ? undefined : user.id);

    const { status, search, limit = '100', offset = '0' } = req.query as {
      status?: string;
      search?: string;
      limit?: string;
      offset?: string;
    };

    const where: any = {};

    // Role-based visibility
    if (user.role !== 'ADMIN') {
      where.OR = [
        { userId: user.id },
        { customerBinIin: user.binIin },
      ];
    }

    // Status filter
    if (status && ['DRAFT', 'PENDING', 'PAID', 'CANCELLED'].includes(status.toUpperCase())) {
      where.status = status.toUpperCase() as InvoiceStatus;
    }

    // Search filter
    if (search && search.trim()) {
      const q = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { invoiceNumber: { contains: q, mode: 'insensitive' } },
            { customerName: { contains: q, mode: 'insensitive' } },
            { customerBinIin: { contains: q } },
            { orderNumber: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const take = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
    const skip = Math.max(parseInt(offset, 10) || 0, 0);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        take,
        skip,
        orderBy: { date: 'desc' },
        include: {
          items: {
            orderBy: { index: 'asc' },
          },
          user: {
            select: {
              id: true,
              companyName: true,
              binIin: true,
              email: true,
              phone: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              paymentStatus: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return res.json({
      invoices,
      total,
      limit: take,
      offset: skip,
    });
  } catch (error) {
    logger.error('Error fetching invoices:', error);
    return res.status(500).json({ message: 'Ошибка при получении списка счетов' });
  }
}

/**
 * GET /api/invoices/:id
 */
export async function getInvoiceById(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Не авторизован' });

    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        items: { orderBy: { index: 'asc' } },
        user: {
          select: {
            id: true,
            companyName: true,
            binIin: true,
            email: true,
            phone: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Счет не найден' });
    }

    // Permission check
    if (user.role !== 'ADMIN' && invoice.userId !== user.id && invoice.customerBinIin !== user.binIin) {
      return res.status(403).json({ message: 'Доступ к счету запрещен' });
    }

    return res.json(invoice);
  } catch (error) {
    logger.error('Error fetching invoice by id:', error);
    return res.status(500).json({ message: 'Ошибка при получении счета' });
  }
}

/**
 * POST /api/invoices
 * Admin only: Create a new invoice in DB
 */
export async function createInvoice(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Только администратор может выставлять счета' });
    }

    const {
      invoiceNumber: providedNumber,
      date,
      dueDate,
      userId,
      orderId,
      orderNumber,
      customerName,
      customerBinIin,
      customerAddress,
      customerPhone,
      notes,
      status = 'PENDING',
      items = [],
    } = req.body;

    // Generate sequence number if not provided
    let invoiceNumber = (providedNumber || '').trim();
    if (!invoiceNumber) {
      const totalCount = await prisma.invoice.count();
      invoiceNumber = `СЧ-${String(totalCount + 1).padStart(4, '0')}`;
    }

    // Calculate item totals
    let calculatedTotal = 0;
    const itemsData = (items || []).map((it: any, idx: number) => {
      const qty = Number(it.quantity ?? it.qty ?? 1);
      const price = Number(it.price ?? 0);
      const sum = Number(it.totalPrice ?? it.sum ?? (qty * price));
      calculatedTotal += sum;
      return {
        index: idx + 1,
        name: String(it.name || 'Услуга'),
        unit: String(it.unit || 'шт.'),
        quantity: qty,
        price: price,
        totalPrice: sum,
      };
    });

    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        date: date ? new Date(date) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: ['DRAFT', 'PENDING', 'PAID', 'CANCELLED'].includes(status) ? status : 'PENDING',
        userId: userId || null,
        orderId: orderId || null,
        orderNumber: orderNumber || null,
        customerName: customerName || 'Покупатель',
        customerBinIin: customerBinIin || '—',
        customerAddress: customerAddress || 'г. Алматы',
        customerPhone: customerPhone || null,
        notes: notes || null,
        totalAmount: calculatedTotal,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
        user: true,
        order: true,
      },
    });

    logger.info(`Invoice ${newInvoice.invoiceNumber} created by admin ${user.email}`);
    return res.status(201).json(newInvoice);
  } catch (error: any) {
    logger.error('Error creating invoice:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Счет с таким номером уже существует' });
    }
    return res.status(500).json({ message: 'Ошибка при создании счета' });
  }
}

/**
 * PATCH /api/invoices/:id/status
 * Admin only: Update invoice status
 */
export async function updateInvoiceStatus(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Только администратор может изменять статус счета' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['DRAFT', 'PENDING', 'PAID', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: 'Некорректный статус счета' });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: status as InvoiceStatus },
      include: { items: true },
    });

    // If invoice is linked to an order and marked PAID, optionally update order paymentStatus
    if (status === 'PAID' && updated.orderId) {
      await prisma.order.update({
        where: { id: updated.orderId },
        data: { paymentStatus: 'PAID' },
      }).catch((e) => logger.warn(`Failed to auto-update order payment status: ${e}`));

      clientTelegramBot.notifyPaymentStatusChanged(updated.orderId, 'PAID').catch(() => {});
    }

    return res.json(updated);
  } catch (error) {
    logger.error('Error updating invoice status:', error);
    return res.status(500).json({ message: 'Ошибка при изменении статуса счета' });
  }
}

/**
 * DELETE /api/invoices/:id
 * Admin only: Delete invoice
 */
export async function deleteInvoice(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Только администратор может удалять счета' });
    }

    const { id } = req.params;
    await prisma.invoice.delete({ where: { id } });

    return res.json({ success: true, message: 'Счет успешно удален' });
  } catch (error) {
    logger.error('Error deleting invoice:', error);
    return res.status(500).json({ message: 'Ошибка при удалении счета' });
  }
}

/**
 * GET /api/invoices/:id/pdf
 * Download or stream PDF for invoice
 */
export async function getInvoicePdf(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Не авторизован' });

    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        items: { orderBy: { index: 'asc' } },
        user: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Счет не найден' });
    }

    // Permission check
    if (user.role !== 'ADMIN' && invoice.userId !== user.id && invoice.customerBinIin !== user.binIin) {
      return res.status(403).json({ message: 'Доступ к счету запрещен' });
    }

    const pdfBuffer = await renderCustomInvoicePdf(invoice);

    const safeNumber = (invoice.invoiceNumber || 'schet').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice_${safeNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (error) {
    logger.error('Error rendering invoice PDF:', error);
    return res.status(500).json({ message: 'Ошибка при генерации PDF счета' });
  }
}

/**
 * POST /api/invoices/:id/pay-balance
 * Client pays invoice using personal balance in LK
 */
export async function payInvoiceWithBalance(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Счет не найден' });
    }

    if (invoice.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Нет доступа к данному счету' });
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return res.status(400).json({ message: 'Счет уже оплачен' });
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      return res.status(400).json({ message: 'Аннулированный счет нельзя оплатить' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, balance: true, companyName: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const invoiceAmount = Number(invoice.totalAmount);
    const currentBalance = Number(user.balance);

    if (currentBalance < invoiceAmount) {
      return res.status(400).json({
        message: `Недостаточно средств на балансе. Требуется: ${invoiceAmount.toLocaleString('ru-RU')} ₸, на балансе: ${currentBalance.toLocaleString('ru-RU')} ₸`,
        requiredAmount: invoiceAmount,
        currentBalance,
        difference: invoiceAmount - currentBalance,
      });
    }

    // Process payment atomically in an interactive transaction with SQL-level balance checks
    let txResult: { updatedUser: any; updatedInvoice: any };
    try {
      txResult = await prisma.$transaction(async (tx) => {
        // 1. Atomic decrement with strict balance check directly in DB
        const userUpdateRes = await tx.user.updateMany({
          where: {
            id: userId,
            balance: { gte: invoiceAmount },
          },
          data: {
            balance: { decrement: invoiceAmount },
          },
        });

        if (userUpdateRes.count === 0) {
          throw new Error('INSUFFICIENT_BALANCE');
        }

        // 2. Atomic invoice update verifying it is not already PAID
        const invoiceUpdateRes = await tx.invoice.updateMany({
          where: {
            id: invoice.id,
            status: { not: InvoiceStatus.PAID },
          },
          data: {
            status: InvoiceStatus.PAID,
          },
        });

        if (invoiceUpdateRes.count === 0) {
          throw new Error('ALREADY_PAID');
        }

        const freshUser = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, balance: true, companyName: true, email: true },
        });

        const freshInvoice = await tx.invoice.findUnique({
          where: { id: invoice.id },
        });

        return { updatedUser: freshUser, updatedInvoice: freshInvoice };
      });
    } catch (txErr: any) {
      if (txErr.message === 'INSUFFICIENT_BALANCE') {
        return res.status(400).json({
          message: `Недостаточно средств на балансе. Требуется: ${invoiceAmount.toLocaleString('ru-RU')} ₸`,
          requiredAmount: invoiceAmount,
        });
      }
      if (txErr.message === 'ALREADY_PAID') {
        return res.status(400).json({ message: 'Счет уже был оплачен ранее' });
      }
      throw txErr;
    }

    const { updatedUser, updatedInvoice } = txResult;

    // If invoice is linked to an order, update order payment status & printAllowed
    if (invoice.orderId) {
      await prisma.order.update({
        where: { id: invoice.orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          printAllowed: true,
        },
      }).catch((e) => logger.warn(`Failed to update linked order payment status: ${e}`));

      await advanceOrderStatus(invoice.orderId, 'PAYMENT_RECEIVED').catch(() => {});

      clientTelegramBot.notifyPaymentStatusChanged(invoice.orderId, 'PAID').catch(() => {});
    }

    // Create an OnlinePayment record for accounting & history
    const timestamp = Date.now().toString().slice(-8);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const paymentNumber = `TB-BAL-${timestamp}-${randomSuffix}`;

    await prisma.onlinePayment.create({
      data: {
        paymentNumber,
        userId,
        invoiceId: invoice.id,
        orderId: invoice.orderId || null,
        type: OnlinePaymentType.INVOICE,
        amount: invoiceAmount,
        currency: 'KZT',
        status: OnlinePaymentStatus.PAID,
        description: `Оплата счета #${invoice.invoiceNumber} с баланса ЛК`,
        pgPaymentDate: new Date(),
        metadata: {
          paidVia: 'BALANCE',
          companyName: user.companyName,
        },
      },
    }).catch((e) => logger.warn(`Failed to create OnlinePayment record for balance pay: ${e}`));

    return res.json({
      success: true,
      message: 'Счет успешно оплачен с баланса',
      newBalance: Number(updatedUser.balance),
      invoice: updatedInvoice,
    });
  } catch (error) {
    logger.error('Error paying invoice with balance:', error);
    return res.status(500).json({ message: 'Ошибка при оплате счета с баланса' });
  }
}

