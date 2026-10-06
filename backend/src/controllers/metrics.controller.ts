import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { OrderStatus, TariffType, OrderCategory } from '@prisma/client';
import { logger } from '../utils/logger';

export const getAdminMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30d', from, to } = req.query as {
      period?: string;
      from?: string;
      to?: string;
    };

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let prevStartDate: Date;
    let prevEndDate: Date;

    // 1. Calculate Date Ranges
    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const dayDuration = now.getTime() - startDate.getTime();
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getTime() - dayDuration);
    } else if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime());
      prevStartDate = new Date(prevEndDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getFullYear(), prevEndDate.getMonth(), 1, 0, 0, 0);
    } else if (period === 'quarter') {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterMonth, 1, 0, 0, 0);
      prevEndDate = new Date(startDate.getTime() - 1);
      const prevQuarterMonth = Math.floor(prevEndDate.getMonth() / 3) * 3;
      prevStartDate = new Date(prevEndDate.getFullYear(), prevQuarterMonth, 1, 0, 0, 0);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getFullYear(), 0, 1, 0, 0, 0);
    } else if (period === 'custom' && from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: 'Некорректный формат дат' });
      }
      // Set to end of day if only date provided
      if (to.length === 10) {
        endDate.setHours(23, 59, 59, 999);
      }
      const duration = endDate.getTime() - startDate.getTime();
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getTime() - duration);
    } else if (period === 'all') {
      startDate = new Date(0);
      prevStartDate = new Date(0);
      prevEndDate = new Date(0);
    } else {
      // Default: 30 days
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime());
      prevStartDate = new Date(prevEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // 2. Fetch Data in Parallel
    const [
      orders,
      prevOrders,
      leads,
      prevLeadsCount,
      newClientsCount,
      prevClientsCount,
      totalClientsAllTime,
    ] = await Promise.all([
      // Current period orders with user details
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              companyName: true,
              binIin: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),

      // Previous period orders for growth comparisons
      period === 'all'
        ? Promise.resolve([])
        : prisma.order.findMany({
            where: {
              createdAt: {
                gte: prevStartDate,
                lte: prevEndDate,
              },
            },
            select: {
              totalPrice: true,
              itemsCount: true,
            },
          }),

      // Current period leads
      prisma.serviceLead.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      // Previous period leads
      period === 'all'
        ? Promise.resolve(0)
        : prisma.serviceLead.count({
            where: {
              createdAt: {
                gte: prevStartDate,
                lte: prevEndDate,
              },
            },
          }),

      // New clients in current period
      prisma.user.count({
        where: {
          role: 'CLIENT',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      // New clients in previous period
      period === 'all'
        ? Promise.resolve(0)
        : prisma.user.count({
            where: {
              role: 'CLIENT',
              createdAt: {
                gte: prevStartDate,
                lte: prevEndDate,
              },
            },
          }),

      // All-time registered clients
      prisma.user.count({
        where: { role: 'CLIENT' },
      }),
    ]);

    // 3. Compute Financial & Operational Metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalPrice || 0)), 0);
    const totalItemsCodes = orders.reduce((sum, o) => sum + (o.itemsCount || 0), 0);
    const paidRevenue = orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + (Number(o.totalPrice || 0)), 0);
    const unpaidRevenue = totalRevenue - paidRevenue;

    const estimatedProfitMargin = Math.round(totalRevenue * 0.72);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const averageItemsPerOrder = totalOrders > 0 ? Math.round(totalItemsCodes / totalOrders) : 0;

    const activeOrders = orders.filter(
      (o) =>
        o.status === OrderStatus.NEW ||
        o.status === OrderStatus.PROCESSING ||
        o.status === OrderStatus.PRINTING ||
        o.status === OrderStatus.STICKERING
    ).length;

    const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED).length;
    const cancelledOrders = orders.filter((o) => o.status === OrderStatus.CANCELLED).length;
    const completionRate =
      totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 100;

    // 4. Compute Growth Percentage vs Previous Period
    const calcGrowth = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    const prevRevenue = prevOrders.reduce((sum, o) => sum + (Number(o.totalPrice || 0)), 0);
    const prevTotalOrders = prevOrders.length;
    const prevItemsCodes = prevOrders.reduce((sum, o) => sum + (o.itemsCount || 0), 0);

    const revenueGrowth = period === 'all' ? 0 : calcGrowth(totalRevenue, prevRevenue);
    const ordersGrowth = period === 'all' ? 0 : calcGrowth(totalOrders, prevTotalOrders);
    const codesGrowth = period === 'all' ? 0 : calcGrowth(totalItemsCodes, prevItemsCodes);
    const clientsGrowth = period === 'all' ? 0 : calcGrowth(newClientsCount, prevClientsCount);

    // 5. Timeline / Chart Data (Daily aggregation)
    const timelineMap: Record<
      string,
      { date: string; label: string; revenue: number; orders: number; codes: number }
    > = {};

    // Helper for formatting date key (YYYY-MM-DD)
    const toDateKey = (d: Date) => d.toISOString().slice(0, 10);

    // Pre-fill days if period <= 31 days so chart is continuous
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 31 && period !== 'all') {
      for (let i = 0; i <= diffDays; i++) {
        const curD = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        if (curD > endDate) break;
        const key = toDateKey(curD);
        timelineMap[key] = {
          date: key,
          label: curD.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
          revenue: 0,
          orders: 0,
          codes: 0,
        };
      }
    }

    orders.forEach((o) => {
      const key = toDateKey(new Date(o.createdAt));
      if (!timelineMap[key]) {
        timelineMap[key] = {
          date: key,
          label: new Date(o.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
          }),
          revenue: 0,
          orders: 0,
          codes: 0,
        };
      }
      timelineMap[key].revenue += Number(o.totalPrice || 0);
      timelineMap[key].orders += 1;
      timelineMap[key].codes += o.itemsCount || 0;
    });

    const dailyTimeline = Object.values(timelineMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // 6. Distribution by Tariff
    const tariffMap: Record<
      string,
      { key: string; name: string; count: number; revenue: number; percentage: number }
    > = {
      DIGITAL: { key: 'DIGITAL', name: 'Только коды (Digital)', count: 0, revenue: 0, percentage: 0 },
      PRINT: { key: 'PRINT', name: 'Печать рулонов', count: 0, revenue: 0, percentage: 0 },
      STANDARD: { key: 'STANDARD', name: 'Стандарт (Печать + проверка)', count: 0, revenue: 0, percentage: 0 },
      PRO: { key: 'PRO', name: 'Под ключ (PRO)', count: 0, revenue: 0, percentage: 0 },
    };

    orders.forEach((o) => {
      const tKey = o.tariffType || 'STANDARD';
      if (!tariffMap[tKey]) {
        tariffMap[tKey] = { key: tKey, name: tKey, count: 0, revenue: 0, percentage: 0 };
      }
      tariffMap[tKey].count += 1;
      tariffMap[tKey].revenue += Number(o.totalPrice || 0);
    });

    Object.values(tariffMap).forEach((t) => {
      t.percentage = totalRevenue > 0 ? Number(((t.revenue / totalRevenue) * 100).toFixed(1)) : 0;
    });

    const tariffDistribution = Object.values(tariffMap);

    // 7. Distribution by Category
    const categoryNamesMap: Record<string, string> = {
      SHOES: 'Обувные товары',
      CLOTHES: 'Одежда и текстиль',
      TEXTILE: 'Постельное белье',
      PHARMA: 'Лекарственные средства',
      TOBACCO: 'Табачные изделия',
      WATER: 'Вода и напитки',
      OTHER: 'Прочие товары',
    };

    const categoryMap: Record<
      string,
      { key: string; name: string; count: number; codes: number; revenue: number; percentage: number }
    > = {};

    orders.forEach((o) => {
      const cKey = o.category || 'OTHER';
      if (!categoryMap[cKey]) {
        categoryMap[cKey] = {
          key: cKey,
          name: categoryNamesMap[cKey] || cKey,
          count: 0,
          codes: 0,
          revenue: 0,
          percentage: 0,
        };
      }
      categoryMap[cKey].count += 1;
      categoryMap[cKey].codes += o.itemsCount || 0;
      categoryMap[cKey].revenue += Number(o.totalPrice || 0);
    });

    Object.values(categoryMap).forEach((c) => {
      c.percentage = totalRevenue > 0 ? Number(((c.revenue / totalRevenue) * 100).toFixed(1)) : 0;
    });

    const categoryDistribution = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);

    // 8. Order Status Funnel
    const statusMap: Record<string, { key: string; name: string; count: number; revenue: number }> = {
      NEW: { key: 'NEW', name: 'Новый заказ', count: 0, revenue: 0 },
      PROCESSING: { key: 'PROCESSING', name: 'Согласование макета', count: 0, revenue: 0 },
      PRINTING: { key: 'PRINTING', name: 'Печать кодов', count: 0, revenue: 0 },
      STICKERING: { key: 'STICKERING', name: 'Оклейка на складе', count: 0, revenue: 0 },
      COMPLETED: { key: 'COMPLETED', name: 'Выполнен', count: 0, revenue: 0 },
      CANCELLED: { key: 'CANCELLED', name: 'Отменен', count: 0, revenue: 0 },
    };

    orders.forEach((o) => {
      const sKey = o.status;
      if (statusMap[sKey]) {
        statusMap[sKey].count += 1;
        statusMap[sKey].revenue += Number(o.totalPrice || 0);
      }
    });

    const statusFunnel = Object.values(statusMap);

    // 9. Top Clients by Revenue
    const clientAggMap: Record<
      string,
      {
        userId: string;
        companyName: string;
        binIin: string;
        email: string;
        phone: string;
        ordersCount: number;
        totalRevenue: number;
        totalCodes: number;
      }
    > = {};

    orders.forEach((o) => {
      const u = o.user;
      if (!u) return;
      if (!clientAggMap[u.id]) {
        clientAggMap[u.id] = {
          userId: u.id,
          companyName: u.companyName,
          binIin: u.binIin,
          email: u.email,
          phone: u.phone,
          ordersCount: 0,
          totalRevenue: 0,
          totalCodes: 0,
        };
      }
      clientAggMap[u.id].ordersCount += 1;
      clientAggMap[u.id].totalRevenue += Number(o.totalPrice || 0);
      clientAggMap[u.id].totalCodes += o.itemsCount || 0;
    });

    const topClients = Object.values(clientAggMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // 10. Service Leads Metrics
    const totalLeads = leads.length;
    const completedLeads = leads.filter((l) => l.status === 'COMPLETED').length;
    const leadsConversionRate =
      totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0;

    return res.json({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalRevenue,
        estimatedProfitMargin,
        paidRevenue,
        unpaidRevenue,
        averageOrderValue,
        averageItemsPerOrder,
        totalOrders,
        activeOrders,
        completedOrders,
        cancelledOrders,
        completionRate,
        totalItemsCodes,
        newClientsCount,
        totalClientsAllTime,
      },
      growth: {
        revenue: revenueGrowth,
        orders: ordersGrowth,
        codes: codesGrowth,
        clients: clientsGrowth,
      },
      dailyTimeline,
      tariffDistribution,
      categoryDistribution,
      statusFunnel,
      topClients,
      leads: {
        total: totalLeads,
        completed: completedLeads,
        conversionRate: leadsConversionRate,
        growth: period === 'all' ? 0 : calcGrowth(totalLeads, prevLeadsCount),
      },
    });
  } catch (error: any) {
    logger.error('getAdminMetrics error:', error);
    return res.status(500).json({ message: 'Ошибка при формировании расширенной аналитики' });
  }
};
