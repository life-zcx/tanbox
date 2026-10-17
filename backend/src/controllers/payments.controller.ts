import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { freedomPayService } from '../services/freedomPay.service';
import { telegram } from '../services/telegram.service';
import { logger } from '../utils/logger';
import { OnlinePaymentStatus, OnlinePaymentType, PaymentStatus, InvoiceStatus, StickerApprovalStatus } from '@prisma/client';

/**
 * 1. Initialize Online Payment with Freedom Pay
 * POST /api/payments/init
 */
export async function initPayment(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const {
      type = 'ORDER',
      orderId,
      invoiceId,
      amount,
      description: customDescription,
      successUrl,
      failureUrl,
    } = req.body;

    const paymentType = type as OnlinePaymentType;
    let paymentAmount = Number(amount);
    let finalDescription = customDescription;
    let targetOrder: any = null;
    let targetInvoice: any = null;

    // Type-specific validations and descriptions
    if (paymentType === OnlinePaymentType.ORDER) {
      if (!orderId) {
        return res.status(400).json({ message: 'Не указан orderId для оплаты заказа' });
      }
      targetOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!targetOrder) {
        return res.status(404).json({ message: 'Заказ не найден' });
      }
      if (targetOrder.userId !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Нет доступа к данному заказу' });
      }
      if (targetOrder.paymentStatus === PaymentStatus.PAID) {
        return res.status(400).json({ message: 'Заказ уже полностью оплачен' });
      }

      // If amount not passed or invalid, use order totalPrice
      if (!paymentAmount || paymentAmount <= 0) {
        paymentAmount = Number(targetOrder.totalPrice);
      }
      if (!finalDescription) {
        finalDescription = `Оплата заказа маркировки #${targetOrder.orderNumber} (клиент: ${user.companyName})`;
      }
    } else if (paymentType === OnlinePaymentType.STICKER_LAYOUT) {
      if (!orderId) {
        return res.status(400).json({ message: 'Не указан orderId для оплаты макета' });
      }
      targetOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!targetOrder) {
        return res.status(404).json({ message: 'Заказ не найден' });
      }
      if (targetOrder.userId !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Нет доступа к данному заказу' });
      }
      // Fixed cost for sticker layout preparation if not specified: 5 000 KZT
      if (!paymentAmount || paymentAmount <= 0) {
        paymentAmount = 5000;
      }
      if (!finalDescription) {
        finalDescription = `Разработка и согласование макета этикетки к заказу #${targetOrder.orderNumber}`;
      }
    } else if (paymentType === OnlinePaymentType.INVOICE) {
      if (!invoiceId) {
        return res.status(400).json({ message: 'Не указан invoiceId' });
      }
      targetInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { order: true },
      });
      if (!targetInvoice) {
        return res.status(404).json({ message: 'Счет на оплату не найден' });
      }
      if (targetInvoice.userId !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Нет доступа к данному счету' });
      }
      if (targetInvoice.status === InvoiceStatus.PAID) {
        return res.status(400).json({ message: 'Счет уже оплачен' });
      }
      if (!paymentAmount || paymentAmount <= 0) {
        paymentAmount = Number(targetInvoice.amount);
      }
      if (!finalDescription) {
        finalDescription = `Оплата счета #${targetInvoice.invoiceNumber} (${user.companyName})`;
      }
    } else if (paymentType === OnlinePaymentType.BALANCE) {
      if (!paymentAmount || paymentAmount < 500) {
        return res.status(400).json({ message: 'Минимальная сумма пополнения баланса — 500 ₸' });
      }
      if (!finalDescription) {
        finalDescription = `Пополнение лицевого счета в TANBOX.KZ (${user.companyName})`;
      }
    }

    // Generate unique payment number
    const timestamp = Date.now().toString().slice(-8);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const paymentNumber = `TB-PAY-${timestamp}-${randomSuffix}`;

    // Create pending payment record in database
    const paymentRecord = await prisma.onlinePayment.create({
      data: {
        paymentNumber,
        userId,
        orderId: targetOrder?.id || null,
        invoiceId: targetInvoice?.id || null,
        type: paymentType,
        amount: paymentAmount,
        currency: 'KZT',
        status: OnlinePaymentStatus.PENDING,
        description: finalDescription,
        metadata: {
          clientBinIin: user.binIin,
          companyName: user.companyName,
          clientPhone: user.phone,
        },
      },
    });

    // Call Freedom Pay init_payment
    const freedomResult = await freedomPayService.initPayment({
      paymentNumber,
      amount: paymentAmount,
      description: finalDescription,
      userEmail: user.email,
      userPhone: user.phone,
      successUrl,
      failureUrl,
    });

    if (!freedomResult.success || !freedomResult.redirectUrl) {
      await prisma.onlinePayment.update({
        where: { id: paymentRecord.id },
        data: {
          status: OnlinePaymentStatus.FAILED,
          rawResponse: { error: freedomResult.error, raw: freedomResult.rawResponse },
        },
      });

      return res.status(400).json({
        message: freedomResult.error || 'Ошибка инициализации онлайн-оплаты в Freedom Pay',
      });
    }

    // Save redirectUrl and pgPaymentId
    await prisma.onlinePayment.update({
      where: { id: paymentRecord.id },
      data: {
        redirectUrl: freedomResult.redirectUrl,
        pgPaymentId: freedomResult.paymentId || null,
      },
    });

    return res.json({
      success: true,
      paymentNumber,
      redirectUrl: freedomResult.redirectUrl,
      paymentId: freedomResult.paymentId,
      amount: paymentAmount,
    });
  } catch (err: any) {
    logger.error('Error in initPayment handler:', { error: err });
    return res.status(500).json({ message: 'Внутренняя ошибка при создании платежа: ' + err.message });
  }
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

    if (isSuccess) {
      // 1. Update Payment status to PAID
      await prisma.onlinePayment.update({
        where: { id: payment.id },
        data: {
          status: OnlinePaymentStatus.PAID,
          pgPaymentId: pgPaymentId || payment.pgPaymentId,
          pgCardPan,
          pgPaymentDate,
          rawResponse: params,
        },
      });

      // 2. Perform business logic depending on payment type
      if (payment.type === OnlinePaymentType.ORDER && payment.orderId) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            printAllowed: true, // Allow printing once paid
          },
        });

        // Also mark any associated Invoice as PAID
        await prisma.invoice.updateMany({
          where: { orderId: payment.orderId },
          data: { status: InvoiceStatus.PAID, paidAt: new Date() },
        });
      } else if (payment.type === OnlinePaymentType.INVOICE && payment.invoiceId) {
        await prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: { status: InvoiceStatus.PAID, paidAt: new Date() },
        });

        if (payment.orderId) {
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: PaymentStatus.PAID, printAllowed: true },
          });
        }
      } else if (payment.type === OnlinePaymentType.STICKER_LAYOUT && payment.orderId) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            stickerApprovalStatus: StickerApprovalStatus.APPROVED,
            printAllowed: true,
          },
        });
      } else if (payment.type === OnlinePaymentType.BALANCE) {
        // Increment user balance
        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            balance: {
              increment: payment.amount,
            },
          },
        });
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
    return res.status(500).json({ message: 'Ошибка получения платежей: ' + err.message });
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
    return res.status(500).json({ message: 'Ошибка получения баланса: ' + err.message });
  }
}
