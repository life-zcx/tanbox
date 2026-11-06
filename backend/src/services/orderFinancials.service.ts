import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { computeOrderPricing } from '../utils/pricing';

export async function syncPendingOrderInvoices(tx: Prisma.TransactionClient, order: { id: string; totalPrice: any; itemsCount: number; pricePerItem: any }) {
  const invoices = await tx.invoice.findMany({ where: { orderId: order.id, status: { in: ['DRAFT', 'PENDING'] } }, select: { id: true } });
  for (const invoice of invoices) {
    await tx.invoice.update({ where: { id: invoice.id }, data: {
      totalAmount: order.totalPrice,
      items: { deleteMany: {}, create: { index: 1, name: 'Услуги по заказу', unit: 'шт.', quantity: order.itemsCount, price: order.pricePerItem, totalPrice: order.totalPrice } },
    } });
  }
}

export async function updateOrderQuote(id: string, data: Prisma.OrderUpdateInput) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${id} FOR UPDATE`;
    const current = await tx.order.findUniqueOrThrow({ where: { id } });
    if (current.pricingInputsKnown === false && data.pricingInputsKnown !== true) throw new Error('Требуется подтверждение исходных параметров стоимости старого заказа.');
    if (current.paymentStatus === 'PAID' || current.paymentStatus === 'REFUNDED' || current.status === 'CANCELLED') {
      throw new Error('Оплаченный или отменённый заказ нельзя пересчитать. Требуется отдельная корректировка.');
    }
    const count = typeof data.itemsCount === 'number' ? data.itemsCount : current.itemsCount;
    if (current.tariffType === 'PRO' && count < 500) throw new Error('PRO minimum is 500');
    if (await tx.orderCodeItem.count({ where: { orderId: id } }) && count !== current.itemsCount) throw new Error('Change uploaded codes before changing their count');
    const pricing = await computeOrderPricing({ tariffType: current.tariffType, itemsCount: count, extraServices: current.extraServices,
      ssccNeeded: current.ssccNeeded, boxesCount: data.boxesCount === null ? undefined : typeof data.boxesCount === 'number' ? data.boxesCount : current.boxesCount ?? undefined,
      includeOfficialCodeFee: typeof data.includeOfficialCodeFee === 'boolean' ? data.includeOfficialCodeFee : current.includeOfficialCodeFee });
    const order = await tx.order.update({ where: { id }, data: { ...data, pricePerItem: pricing.unitPrice, totalPrice: pricing.totalPrice, documentVersion: { increment: 1 } }, include: { user: { select: { id: true, email: true, companyName: true, binIin: true, phone: true } } } });
    await syncPendingOrderInvoices(tx, order);
    return order;
  });
}

export async function updateOrderAdministrativeState(id: string, data: Prisma.OrderUpdateInput) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${id} FOR UPDATE`;
    const order = await tx.order.update({ where: { id }, data });
    if (typeof data.paymentStatus === 'string' || data.status === 'CANCELLED') {
      if (order.paymentStatus === 'PAID') {
        await syncPendingOrderInvoices(tx, order);
        await grantPaidTemplate(tx, order);
      }
      const status = order.status === 'CANCELLED' || order.paymentStatus === 'REFUNDED' ? 'CANCELLED' : order.paymentStatus === 'PAID' ? 'PAID' : 'PENDING';
      await tx.invoice.updateMany({ where: { orderId: id, status: { not: 'CANCELLED' } }, data: { status } });
    }
    return order;
  });
}

export async function grantPaidTemplate(tx: Prisma.TransactionClient, order: { userId: string; templateId?: string | null; extraServices?: string[] }) {
  if (order.templateId && order.extraServices?.some(service => ['STICKER_LAYOUT_APPROVAL', 'STICKER_LAYOUT_DESIGN'].includes(service))) {
    await tx.userStickerTemplate.updateMany({ where: { id: order.templateId, userId: order.userId, isPaid: false }, data: { isPaid: true, paidAt: new Date() } });
  }
}
