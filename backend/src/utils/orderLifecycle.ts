import { prisma } from '../config/db';
import { OrderStatus, PaymentStatus, TariffType } from '@prisma/client';
import { logger } from './logger';
import { clientTelegramBot } from '../services/clientTelegram.service';

export type OrderLifecycleEvent =
  | 'PAYMENT_RECEIVED'
  | 'CODES_ATTACHED'
  | 'PDF_GENERATED'
  | 'UTILISATION_REPORT_ACCEPTED';

export async function advanceOrderStatus(
  orderId: string,
  event: OrderLifecycleEvent,
  options?: { tx?: any }
): Promise<OrderStatus | null> {
  try {
    const db = options?.tx || prisma;
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        tariffType: true,
        status: true,
        paymentStatus: true,
        codesFileUrl: true,
        pdfUrl: true,
        userId: true,
      },
    });

    if (!order || order.status === OrderStatus.CANCELLED) {
      return null;
    }

    let nextStatus: OrderStatus = order.status;
    const isDigital = order.tariffType === TariffType.DIGITAL;
    const isPaid = order.paymentStatus === PaymentStatus.PAID;
    const hasCodes = !!order.codesFileUrl;
    const hasPdf = !!order.pdfUrl;

    switch (event) {
      case 'PAYMENT_RECEIVED': {
        // When payment is confirmed:
        if (order.status === OrderStatus.NEW) {
          if (isDigital && hasCodes && hasPdf) {
            nextStatus = OrderStatus.COMPLETED;
          } else {
            nextStatus = OrderStatus.PROCESSING;
          }
        }
        break;
      }

      case 'CODES_ATTACHED': {
        // When codes arrive (via file upload or IS MPT sync):
        if (order.status === OrderStatus.NEW) {
          nextStatus = OrderStatus.PROCESSING;
        }
        if (isDigital && isPaid && hasPdf) {
          nextStatus = OrderStatus.COMPLETED;
        }
        break;
      }

      case 'PDF_GENERATED': {
        // When PDF generation completes:
        if (isDigital && isPaid) {
          nextStatus = OrderStatus.COMPLETED;
        } else if (order.status === OrderStatus.NEW || order.status === OrderStatus.PROCESSING) {
          if (order.tariffType === TariffType.PRINT) {
            nextStatus = OrderStatus.PRINTING;
          }
        }
        break;
      }

      case 'UTILISATION_REPORT_ACCEPTED': {
        // When report of utilisation is accepted by IS MPT:
        if (isDigital && isPaid) {
          nextStatus = OrderStatus.COMPLETED;
        }
        break;
      }
    }

    if (nextStatus !== order.status) {
      logger.info(
        `[OrderLifecycle] Auto-advancing order #${order.orderNumber} status: ${order.status} -> ${nextStatus} (event: ${event})`
      );
      await db.order.update({
        where: { id: order.id },
        data: { status: nextStatus },
      });

      // Send telegram alert to client
      clientTelegramBot.notifyOrderStatusChanged(order.id, nextStatus).catch(() => {});
      return nextStatus;
    }

    return order.status;
  } catch (error: any) {
    logger.warn(`[OrderLifecycle] Failed to advance status for order ${orderId}: ${error?.message || error}`);
    return null;
  }
}
