import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAdminMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsersCount = await prisma.user.count({ where: { role: 'CLIENT' } });
    const totalOrdersCount = await prisma.order.count();

    const orders = await prisma.order.findMany();

    let totalRevenue = 0;
    let totalItems = 0;
    let activeOrdersCount = 0;

    orders.forEach((o) => {
      totalRevenue += o.totalPrice;
      totalItems += o.itemsCount;
      if (o.status !== 'COMPLETED' && o.status !== 'CANCELLED') {
        activeOrdersCount++;
      }
    });

    // Approximate platform profit margin (~70%)
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
