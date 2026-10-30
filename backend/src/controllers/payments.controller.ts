import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { freedomPayService } from '../services/freedomPay.service';
import { telegram } from '../services/telegram.service';
import { logger } from '../utils/logger';
import { OnlinePaymentStatus, OnlinePaymentType, PaymentStatus, InvoiceStatus, StickerApprovalStatus } from '@prisma/client';
import { advanceOrderStatus } from '../utils/orderLifecycle';

/**
 * 1. Initialize Online Payment with Freedom Pay
 * POST /api/payments/init
 */
export async function initPayment(req: AuthRequest, res: Response) {
  return res.status(400).json({
    message: 'Онлайн-оплата банковскими картами отключена. Оплата принимается по счету (безналичный расчет / Kaspi Pay) или с лицевого счета ЛК.',
  });
}


/**
 * 2. Freedom Pay Pre-authorization Check Webhook
 * POST /api/payments/freedom/check and check.php
 */
export async function freedomCheckWebhook(req: Request, res: Response) {
  const params = { ...req.query, ...req.body } as Record<string, any>;
  const scriptName = req.path.endsWith('.php') ? 'check.php' : 'check';
  const candidateScripts = [scriptName, 'check.php', 'check', 'freedom/check', 'freedom/check.php'];

  logger.info(`[FreedomPay] Incoming check webhook:`, { params });

  try {
    const incomingSig = String(params.pg_sig || '');
    const isSigValid = freedomPayService.verifyPgSig(candidateScripts, params, incomingSig);

    if (!isSigValid) {
      logger.warn('[FreedomPay] Check signature mismatch', { params, incomingSig });
      const xml = freedomPayService.buildXmlResponse(scriptName, 'rejected', 'Неверная электронная подпись запроса (pg_sig)');
      return res.type('application/xml').send(xml);
    }

    const paymentNumber = String(params.pg_order_id || '');
    const requestedAmount = Number(params.pg_amount || 0);

    const payment = await prisma.onlinePayment.findUnique({
      where: { paymentNumber },
    });

    if (!payment) {
      const xml = freedomPayService.buildXmlResponse(scriptName, 'rejected', 'Платеж не найден в системе TANBOX');
      return res.type('application/xml').send(xml);
    }

    if (payment.status === OnlinePaymentStatus.PAID) {
      const xml = freedomPayService.buildXmlResponse(scriptName, 'rejected', 'Счет уже оплачен ранее');
      return res.type('application/xml').send(xml);
    }

    // Validate amount (allow small floating point variance < 0.01)
    if (Math.abs(Number(payment.amount) - requestedAmount) > 0.01) {
      const xml = freedomPayService.buildXmlResponse(scriptName, 'rejected', `Неверная сумма (ожидается ${payment.amount} KZT)`);
      return res.type('application/xml').send(xml);
    }

    // Success
    const xml = freedomPayService.buildXmlResponse(scriptName, 'ok', 'Платеж готов к обработке');
    return res.type('application/xml').send(xml);
  } catch (err: any) {
    logger.error('[FreedomPay] Check webhook error:', { error: err });
    const xml = freedomPayService.buildXmlResponse(scriptName, 'error', 'Ошибка сервера: ' + err.message);
    return res.type('application/xml').send(xml);
  }
}

/**
 * 3. Freedom Pay Final Payment Result Webhook
 * POST /api/payments/freedom/result and result.php
 */
export async function freedomResultWebhook(req: Request, res: Response) {
  const params = { ...req.query, ...req.body } as Record<string, any>;
  const scriptName = req.path.endsWith('.php') ? 'result.php' : 'result';
  const candidateScripts = [scriptName, 'result.php', 'result', 'freedom/result', 'freedom/result.php'];

  logger.info(`[FreedomPay] Incoming result webhook:`, { params });

  try {
    const incomingSig = String(params.pg_sig || '');
    const isSigValid = freedomPayService.verifyPgSig(candidateScripts, params, incomingSig);

    if (!isSigValid) {
      logger.warn('[FreedomPay] Result signature mismatch', { params, incomingSig });
      const xml = freedomPayService.buildXmlResponse(scriptName, 'rejected', 'Неверная электронная подпись запроса (pg_sig)');
      return res.type('application/xml').send(xml);
    }

    const paymentNumber = String(params.pg_order_id || '');
    const isSuccess = String(params.pg_result) === '1';
    const pgPaymentId = params.pg_payment_id ? String(params.pg_payment_id) : undefined;
    const pgCardPan = params.pg_card_pan ? String(params.pg_card_pan) : null;
    const pgPaymentDate = params.pg_payment_date ? new Date(params.pg_payment_date) : new Date();

    const payment = await prisma.onlinePayment.findUnique({
      where: { paymentNumber },
      include: {
        user: true,
        order: true,
      },
    });

    if (!payment) {
      const xml = freedomPayService.buildXmlResponse(scriptName, 'rejected', 'Платеж не найден');
      return res.type('application/xml').send(xml);
    }

    // If already processed as PAID, return OK idempotently
    if (payment.status === OnlinePaymentStatus.PAID) {
      const xml = freedomPayService.buildXmlResponse(scriptName, 'ok', 'Платеж уже был успешно учтен');
      return res.type('application/xml').send(xml);
    }

    // Strict amount verification in result webhook to protect against partial/tampered payments
    const requestedAmount = params.pg_amount !== undefined ? Number(params.pg_amount) : undefined;
    if (requestedAmount !== undefined && !isNaN(requestedAmount) && Math.abs(Number(payment.amount) - requestedAmount) > 0.01) {
      logger.warn(`[FreedomPay] Amount mismatch in result webhook: expected ${payment.amount}, received ${requestedAmount}`);
      const xml = freedomPayService.buildXmlResponse(scriptName, 'rejected', `Неверная сумма платежа (ожидается ${payment.amount} KZT)`);
      return res.type('application/xml').send(xml);
    }

    if (isSuccess) {
      // 1. Atomic status transition: ensure only ONE webhook process executes the credit/status change
      const wasUpdated = await prisma.$transaction(async (tx) => {
        const updateResult = await tx.onlinePayment.updateMany({
          where: {
            id: payment.id,
            status: { not: OnlinePaymentStatus.PAID },
          },
          data: {
            status: OnlinePaymentStatus.PAID,
            pgPaymentId: pgPaymentId || payment.pgPaymentId,
            pgCardPan,
            pgPaymentDate,
            rawResponse: params,
          },
        });

        if (updateResult.count === 0) {
          // Already transitioned to PAID by a concurrent webhook call
          return false;
        }

        // 2. Perform business logic depending on payment type atomically
        if (payment.type === OnlinePaymentType.ORDER && payment.orderId) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: PaymentStatus.PAID,
              printAllowed: true,
            },
          });

          await tx.invoice.updateMany({
            where: { orderId: payment.orderId },
            data: { status: InvoiceStatus.PAID },
          });
        } else if (payment.type === OnlinePaymentType.INVOICE && payment.invoiceId) {
          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: { status: InvoiceStatus.PAID },
          });

          if (payment.orderId) {
            await tx.order.update({
              where: { id: payment.orderId },
              data: { paymentStatus: PaymentStatus.PAID, printAllowed: true },
            });
          }
        } else if (payment.type === OnlinePaymentType.STICKER_LAYOUT && payment.orderId) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              stickerApprovalStatus: StickerApprovalStatus.APPROVED,
              printAllowed: true,
            },
          });
        } else if (payment.type === OnlinePaymentType.BALANCE) {
          // Increment user balance atomically inside transaction
          await tx.user.update({
            where: { id: payment.userId },
            data: {
              balance: {
                increment: payment.amount,
              },
            },
          });
        }

        return true;
      });

      if (!wasUpdated) {
        // Concurrency guard: already processed by parallel request
        const xml = freedomPayService.buildXmlResponse(scriptName, 'ok', 'Платеж уже был успешно учтен');
        return res.type('application/xml').send(xml);
      }

      // Non-blocking asynchronous follow-ups
      if (payment.orderId) {
        advanceOrderStatus(payment.orderId, 'PAYMENT_RECEIVED').catch(() => {});
      }

      // 3. Send Telegram Notification to Admin Leads Chat
      telegram.sendOnlinePaymentNotification({
        paymentNumber: payment.paymentNumber,
        amount: payment.amount.toString(),
        companyName: payment.user.companyName,
        email: payment.user.email,
        phone: payment.user.phone,
        type: payment.type,
        description: payment.description,
        cardPan: pgCardPan,
      }).catch((err) => {
        logger.error('Failed to send Telegram notification for online payment:', err);
      });

      logger.info(`[FreedomPay] Payment ${paymentNumber} successfully processed! Amount: ${payment.amount} KZT`);
      const xml = freedomPayService.buildXmlResponse(scriptName, 'ok', 'Платеж успешно зачислен');
      return res.type('application/xml').send(xml);
    } else {
      // Payment failed at gateway
      await prisma.onlinePayment.update({
        where: { id: payment.id },
        data: {
          status: OnlinePaymentStatus.FAILED,
          rawResponse: params,
        },
      });

      logger.warn(`[FreedomPay] Payment ${paymentNumber} rejected by Freedom Pay:`, { params });
      const xml = freedomPayService.buildXmlResponse(scriptName, 'ok', 'Отказ платежа зафиксирован');
      return res.type('application/xml').send(xml);
    }
  } catch (err: any) {
    logger.error('[FreedomPay] Result webhook error:', { error: err });
    const xml = freedomPayService.buildXmlResponse(scriptName, 'error', 'Ошибка сервера: ' + err.message);
    return res.type('application/xml').send(xml);
  }
}

/**
 * 4. Get Current User's Payments
 * GET /api/payments/my
 */
export async function getMyPayments(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const payments = await prisma.onlinePayment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalPrice: true,
            status: true,
          },
        },
      },
    });

    return res.json(payments);
  } catch (err: any) {
    logger.error('Error in getMyPayments:', { error: err });
    const message = process.env.NODE_ENV === 'production'
      ? 'Ошибка при получении списка платежей'
      : ('Ошибка получения платежей: ' + err.message);
    return res.status(500).json({ message });
  }
}

/**
 * 5. Get User Balance & Info
 * GET /api/payments/balance
 */
export async function getUserBalance(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        companyName: true,
        balance: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    return res.json({
      balance: Number(user.balance || 0),
      userId: user.id,
      companyName: user.companyName,
    });
  } catch (err: any) {
    logger.error('Error in getUserBalance:', { error: err });
    const message = process.env.NODE_ENV === 'production'
      ? 'Ошибка при получении баланса'
      : ('Ошибка получения баланса: ' + err.message);
    return res.status(500).json({ message });
  }
}

/**
 * 6. Get Current User's Full Balance & Payment History
 * GET /api/payments/history
 */
export async function getMyBalanceHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const payments = await prisma.onlinePayment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalPrice: true,
            status: true,
          },
        },
      },
    });

    const history = payments.map((p) => {
      const meta = (p.metadata as any) || {};
      const isManual = Boolean(meta.manualByAdmin);
      const isBalanceDebit = meta.paidVia === 'BALANCE' || meta.paidViaBalance === true || meta.action === 'DEBIT';
      const isBalanceCredit = p.type === OnlinePaymentType.BALANCE && meta.action !== 'DEBIT';

      let direction: 'IN' | 'OUT' = isBalanceCredit ? 'IN' : 'OUT';
      if (!isBalanceCredit && !isBalanceDebit) {
        direction = 'IN';
      }

      let category = 'OTHER';
      if (isManual) {
        category = meta.action === 'DEBIT' ? 'ADMIN_DEBIT' : 'ADMIN_TOPUP';
      } else if (p.type === OnlinePaymentType.BALANCE) {
        category = 'ONLINE_TOPUP';
      } else if (p.type === OnlinePaymentType.ORDER) {
        category = 'ORDER_PAYMENT';
      } else if (p.type === OnlinePaymentType.STICKER_LAYOUT) {
        category = 'LAYOUT_PAYMENT';
      }

      return {
        id: p.id,
        paymentNumber: p.paymentNumber,
        type: p.type,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        description: p.description,
        createdAt: p.createdAt,
        direction,
        category,
        order: p.order,
        metadata: meta,
      };
    });

    return res.json({ history });
  } catch (err: any) {
    logger.error('Error in getMyBalanceHistory:', { error: err });
    const message = process.env.NODE_ENV === 'production'
      ? 'Ошибка при получении истории операций'
      : ('Ошибка получения истории баланса: ' + err.message);
    return res.status(500).json({ message });
  }
}
