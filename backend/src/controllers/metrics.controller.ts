import { BUSINESS_TIME_ZONE, businessDateKey } from '../config/timezone';
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
      startDate = new Date(from.length === 10 ? from + 'T00:00:00' : from);
      endDate = new Date(to.length === 10 ? to + 'T00:00:00' : to);
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

    if (startDate > endDate) return res.status(400).json({ message: 'Invalid date range' });
    const currentWhere = { createdAt: { gte: startDate, lte: endDate } };
    const previousWhere = { createdAt: { gte: prevStartDate, lte: prevEndDate } };
    const [current, previous, tariffGroups, categoryGroups, statusGroups, paymentGroups, leadGroups, previousLeads, clients, previousClients, allClients, rankedClients] = await Promise.all([
      prisma.order.aggregate({ where: currentWhere, _count: { _all: true }, _sum: { totalPrice: true, itemsCount: true } }),
      period === 'all' ? null : prisma.order.aggregate({ where: previousWhere, _count: { _all: true }, _sum: { totalPrice: true, itemsCount: true } }),
      prisma.order.groupBy({ by: ['tariffType'], where: currentWhere, _count: { _all: true }, _sum: { totalPrice: true } }),
      prisma.order.groupBy({ by: ['category'], where: currentWhere, _count: { _all: true }, _sum: { totalPrice: true, itemsCount: true } }),
      prisma.order.groupBy({ by: ['status'], where: currentWhere, _count: { _all: true }, _sum: { totalPrice: true } }),
      prisma.order.groupBy({ by: ['paymentStatus'], where: currentWhere, _sum: { totalPrice: true } }),
      prisma.serviceLead.groupBy({ by: ['status'], where: currentWhere, _count: { _all: true } }),
      period === 'all' ? 0 : prisma.serviceLead.count({ where: previousWhere }),
      prisma.user.count({ where: { role: 'CLIENT', ...currentWhere } }),
      period === 'all' ? 0 : prisma.user.count({ where: { role: 'CLIENT', ...previousWhere } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.order.groupBy({ by: ['userId'], where: currentWhere, _count: { _all: true }, _sum: { totalPrice: true, itemsCount: true }, orderBy: { _sum: { totalPrice: 'desc' } }, take: 10 }),
    ]);
    const clientProfiles = await prisma.user.findMany({ where: { id: { in: rankedClients.map(row => row.userId) } }, select: { id: true, companyName: true, binIin: true, email: true, phone: true } });
    const totalRevenue = Number(current._sum.totalPrice || 0), totalOrders = current._count._all;
    const totalItemsCodes = current._sum.itemsCount || 0;
    const paidRevenue = Number(paymentGroups.find(row => row.paymentStatus === 'PAID')?._sum.totalPrice || 0);
    const growth = (value: number, old: number) => period === 'all' ? 0 : old === 0 ? value > 0 ? 100 : 0 : Number(((value - old) / old * 100).toFixed(1));
    const percentage = (value: number) => totalRevenue ? Number((value / totalRevenue * 100).toFixed(1)) : 0;
    const tariffNames: Record<string, string> = {"DIGITAL": "Только коды (Digital)", "PRINT": "Печать рулонов", "STANDARD": "Стандарт (Печать + проверка)", "PRO": "Под ключ (PRO)"};
    const categoryNames: Record<string, string> = {
      SHOES: 'Обувные товары',
      CLOTHES: 'Одежда и текстиль',
      TEXTILE: 'Постельное белье',
      PHARMA: 'Лекарственные средства',
      TOBACCO: 'Табачные изделия',
      WATER: 'Вода и напитки',
      OTHER: 'Прочие товары',
    };
    const statusNames: Record<string, string> = {"NEW": "Новый заказ", "PROCESSING": "Согласование макета", "PRINTING": "Печать кодов", "STICKERING": "Оклейка на складе", "COMPLETED": "Выполнен", "CANCELLED": "Отменен"};
    const tariffDistribution = Object.values(TariffType).map(key => {
      const row = tariffGroups.find(row => row.tariffType === key); const revenue = Number(row?._sum.totalPrice || 0);
      return { key, name: tariffNames[key] || key, count: row?._count._all || 0, revenue, percentage: percentage(revenue) };
    });
    const categoryDistribution = categoryGroups.map(row => ({ key: row.category, name: categoryNames[row.category] || row.category, count: row._count._all,
      codes: row._sum.itemsCount || 0, revenue: Number(row._sum.totalPrice || 0), percentage: percentage(Number(row._sum.totalPrice || 0)) })).sort((a,b) => b.revenue - a.revenue);
    const statusFunnel = Object.values(OrderStatus).map(key => {
      const row = statusGroups.find(row => row.status === key);
      return { key, name: statusNames[key] || key, count: row?._count._all || 0, revenue: Number(row?._sum.totalPrice || 0) };
    });
    const countStatus = (key: OrderStatus) => statusGroups.find(row => row.status === key)?._count._all || 0;
    const bucket = endDate.getTime() - startDate.getTime() > 366 * 86400000 ? 'month' : 'day';
    const timeline = await prisma.$queryRaw<Array<{ date: string; revenue: any; orders: number; codes: any }>>`
      SELECT date_trunc(${bucket}, ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${BUSINESS_TIME_ZONE})::date::text AS date,
             SUM("totalPrice") AS revenue, COUNT(*)::int AS orders, SUM("itemsCount") AS codes
      FROM "Order" WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY 1 ORDER BY 1`;
    const timelineMap = new Map(timeline.map(row => [row.date, { date: row.date, label: row.date, revenue: Number(row.revenue || 0), orders: Number(row.orders), codes: Number(row.codes || 0) }]));
    if (bucket === 'day' && endDate.getTime() - startDate.getTime() <= 31 * 86400000) {
      for (let time = startDate.getTime(); time <= endDate.getTime(); time += 86400000) {
        const key = businessDateKey(new Date(time));
        if (!timelineMap.has(key)) timelineMap.set(key, { date: key, label: key, revenue: 0, orders: 0, codes: 0 });
      }
    }
    const totalLeads = leadGroups.reduce((sum, row) => sum + row._count._all, 0);
    const completedLeads = leadGroups.find(row => row.status === 'COMPLETED')?._count._all || 0;
    const completedOrders = countStatus('COMPLETED'), cancelledOrders = countStatus('CANCELLED');
    return res.json({
      period, startDate: startDate.toISOString(), endDate: endDate.toISOString(),
      summary: { totalRevenue, estimatedProfitMargin: Math.round(totalRevenue * .72), paidRevenue, unpaidRevenue: totalRevenue - paidRevenue,
        averageOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
        averageItemsPerOrder: totalOrders ? Math.round(totalItemsCodes / totalOrders) : 0,
        totalOrders, activeOrders: totalOrders - completedOrders - cancelledOrders, completedOrders, cancelledOrders,
        completionRate: totalOrders ? Math.round(completedOrders / totalOrders * 100) : 100, totalItemsCodes,
        newClientsCount: clients, totalClientsAllTime: allClients },
      growth: { revenue: growth(totalRevenue, Number(previous?._sum.totalPrice || 0)), orders: growth(totalOrders, previous?._count._all || 0),
        codes: growth(totalItemsCodes, previous?._sum.itemsCount || 0), clients: growth(clients, previousClients) },
      dailyTimeline: [...timelineMap.values()].sort((a,b) => a.date.localeCompare(b.date)), tariffDistribution, categoryDistribution, statusFunnel,
      topClients: rankedClients.map(row => {
        const profile = clientProfiles.find(profile => profile.id === row.userId);
        return { userId: row.userId, companyName: profile?.companyName || '', binIin: profile?.binIin || '', email: profile?.email || '', phone: profile?.phone || '',
          ordersCount: row._count._all, totalRevenue: Number(row._sum.totalPrice || 0), totalCodes: row._sum.itemsCount || 0 };
      }),
      leads: { total: totalLeads, completed: completedLeads, conversionRate: totalLeads ? Math.round(completedLeads / totalLeads * 100) : 0, growth: growth(totalLeads, previousLeads) },
    });
  } catch (error) {
    logger.error('getAdminMetrics error:', error);
    return res.status(500).json({ message: 'Metrics unavailable' });
  }
};
