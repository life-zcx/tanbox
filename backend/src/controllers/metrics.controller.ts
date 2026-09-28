import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { OrderStatus } from '@prisma/client';

export const getAdminMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsersCount, totalOrdersCount, activeOrdersCount, totals] = await Promise.all([
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.order.count(),
      prisma.order.count({
        where: {
          status: {
            notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
          },
        },
      }),
      prisma.order.aggregate({
        _sum: {
          totalPrice: true,
          itemsCount: true,
        },
      }),
    ]);

    const totalRevenue = totals._sum.totalPrice || 0;
    const totalItems = totals._sum.itemsCount || 0;

    // Approximate platform profit margin (~72%)
    const totalMarginEst = Math.round(totalRevenue * 0.72);

    return res.json({
      totalClients: totalUsersCount,
      totalOrders: totalOrdersCount,
      activeOrders: activeOrdersCount,
      totalItemsCodes: totalItems,
      totalRevenue,
      estimatedProfitMargin: totalMarginEst,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Ошибка при формировании аналитики' });
  }
};
