import { randomUUID } from 'crypto';
import { InvoiceStatus, OnlinePaymentStatus, OnlinePaymentType, PaymentStatus } from '@prisma/client';
import { prisma } from '../config/db';
import { grantPaidTemplate } from './orderFinancials.service';

export class BalancePaymentError extends Error {
  constructor(public code: string, public status: number, message: string) { super(message); }
}

/** One lock order for both payment entry points: order -> payer -> invoice. */
export async function payWithBalance(userId: string, isAdmin: boolean, kind: 'order' | 'invoice', id: string) {
  return prisma.$transaction(async (tx) => {
    const initialInvoice = kind === 'invoice' ? await tx.invoice.findUnique({ where: { id } }) : null;
    if (kind === 'invoice' && !initialInvoice) throw new BalancePaymentError('NOT_FOUND', 404, 'Счет не найден');
    const orderId = kind === 'order' ? id : initialInvoice?.orderId;
    if (orderId) await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    if (kind === 'invoice') await tx.$queryRaw`SELECT "id" FROM "Invoice" WHERE "id" = ${id} FOR UPDATE`;

    // Read amounts, ownership and status only after obtaining the locks.
    const invoice = kind === 'invoice' ? await tx.invoice.findUnique({ where: { id } }) : null;
    const order = orderId ? await tx.order.findUnique({ where: { id: orderId } }) : null;
    const target = kind === 'invoice' ? invoice : order;
    if (!target) throw new BalancePaymentError('NOT_FOUND', 404, 'Счет или заказ не найден');
    if (target.userId !== userId && !isAdmin) throw new BalancePaymentError('FORBIDDEN', 403, 'Нет доступа к оплате');
    if (invoice?.orderId !== initialInvoice?.orderId) throw new BalancePaymentError('CHANGED', 409, 'Счет изменился. Обновите страницу');
    if (invoice?.status === InvoiceStatus.CANCELLED || order?.status === 'CANCELLED') {
      throw new BalancePaymentError('CANCELLED', 400, 'Аннулированный счет или заказ нельзя оплатить');
    }
    if (invoice?.status === InvoiceStatus.PAID || order?.paymentStatus === PaymentStatus.PAID) {
      throw new BalancePaymentError('ALREADY_PAID', 409, 'Счет или заказ уже оплачен');
    }
    if (orderId && await tx.invoice.count({ where: { orderId, status: InvoiceStatus.PAID } })) {
      throw new BalancePaymentError('ALREADY_PAID', 409, 'Оплата связанного счета уже учтена');
    }
    const amount = invoice ? invoice.totalAmount : order!.totalPrice;
    if (invoice && order && (!invoice.totalAmount.equals(order.totalPrice) || invoice.userId !== order.userId)) {
      throw new BalancePaymentError('STALE_INVOICE', 409, 'Счёт не соответствует актуальному заказу. Запросите обновлённый счёт.');
    }
    if (amount.lessThanOrEqualTo(0)) throw new BalancePaymentError('INVALID_AMOUNT', 400, 'Сумма оплаты должна быть положительной');
    const debit = await tx.user.updateMany({
      where: { id: userId, balance: { gte: amount } }, data: { balance: { decrement: amount } },
    });
    if (!debit.count) throw new BalancePaymentError('INSUFFICIENT_BALANCE', 400, `Недостаточно средств на балансе. Требуется: ${amount.toString()} ₸`);

    if (orderId) {
      await tx.order.update({ where: { id: orderId }, data: { paymentStatus: PaymentStatus.PAID, printAllowed: true } });
      await tx.invoice.updateMany({ where: { orderId, status: { not: InvoiceStatus.CANCELLED } }, data: { status: InvoiceStatus.PAID } });
      await grantPaidTemplate(tx, order!);
    } else {
      await tx.invoice.update({ where: { id }, data: { status: InvoiceStatus.PAID } });
    }
    await tx.onlinePayment.create({ data: {
      paymentNumber: `TB-BAL-${randomUUID()}`, userId, orderId: orderId || null, invoiceId: invoice?.id || null,
      type: kind === 'invoice' ? OnlinePaymentType.INVOICE : OnlinePaymentType.ORDER,
      amount, currency: 'KZT', status: OnlinePaymentStatus.PAID, pgPaymentDate: new Date(),
      description: invoice ? `Оплата счета #${invoice.invoiceNumber} с баланса ЛК` : `Оплата заказа #${order!.orderNumber} с баланса ЛК`,
      metadata: { paidVia: 'BALANCE' },
    } });
    const updatedUser = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { balance: true } });
    return {
      newBalance: Number(updatedUser.balance), orderId,
      order: orderId ? await tx.order.findUnique({ where: { id: orderId } }) : null,
      invoice: invoice ? await tx.invoice.findUnique({ where: { id: invoice.id } }) : null,
    };
  }, { timeout: 15000 });
}
