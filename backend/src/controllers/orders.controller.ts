import { Response } from 'express';
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
        notes: typeof notes === 'string' ? notes.slice(0, 1000) : '',
        status: OrderStatus.NEW,
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

    const order = await prisma.order.findUnique({
      where: { id },
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
    const { status, pdfUrl } = req.body;

    if (status && !Object.values(OrderStatus).includes(status as OrderStatus)) {
      return res.status(400).json({ message: 'Некорректный статус заказа' });
    }

    if (pdfUrl !== undefined && !isSafeUrl(pdfUrl)) {
      return res.status(400).json({ message: 'Недопустимый формат URL документа' });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...(status ? { status: status as OrderStatus } : {}),
        ...(pdfUrl !== undefined ? { pdfUrl } : {}),
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
