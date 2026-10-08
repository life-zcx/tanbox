import { Request, Response } from 'express';
import http from 'http';
import { prisma } from '../config/db';
import { MarkirovkaEnvironment, OrderCategory } from '@prisma/client';
import { encryptText } from '../utils/encryption';
import {
  MarkirovkaClient,
  CATEGORY_LABELS,
  CATEGORY_TO_OMS_EXTENSION,
  getDefaultBaseUrl,
} from '../services/markirovkaClient.service';
import { logger } from '../utils/logger';

export async function getAccounts(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const where: any = {};
    if (user?.role !== 'ADMIN') {
      where.userId = user?.id;
    }

    const accounts = await prisma.markirovkaAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            orders: true,
            reports: true,
          },
        },
      },
    });

    const safeAccounts = accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      environment: acc.environment,
      baseUrl: acc.baseUrl || getDefaultBaseUrl(acc.environment),
      login: acc.login,
      omsId: acc.omsId,
      status: acc.status,
      tokenExpiresAt: acc.tokenExpiresAt,
      lastCheckedAt: acc.lastCheckedAt,
      lastError: acc.lastError,
      createdAt: acc.createdAt,
      ordersCount: acc._count.orders,
      reportsCount: acc._count.reports,
    }));

    return res.json({
      accounts: safeAccounts,
      categories: Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
        key,
        label,
        extension: CATEGORY_TO_OMS_EXTENSION[key as OrderCategory],
      })),
    });
  } catch (error: any) {
    logger.error('Failed to get markirovka accounts:', error);
    return res.status(500).json({ message: 'Ошибка получения списка аккаунтов маркировки' });
  }
}

export async function createAccount(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { name, environment, baseUrl, login, password, omsId, userId: targetUserId } = req.body;

    if (!name || !login || !password) {
      return res.status(400).json({ message: 'Название, логин и пароль обязательны' });
    }

    const envEnum = environment === 'PROD' ? MarkirovkaEnvironment.PROD : MarkirovkaEnvironment.TEST;
    const encryptedPassword = encryptText(password.trim());

    const account = await prisma.markirovkaAccount.create({
      data: {
        userId: user?.role === 'ADMIN' ? (targetUserId || null) : user?.id,
        name: name.trim(),
        environment: envEnum,
        baseUrl: baseUrl?.trim() || null,
        login: login.trim(),
        encryptedPassword,
        omsId: omsId?.trim() || null,
      },
    });

    return res.status(201).json({
      id: account.id,
      name: account.name,
      environment: account.environment,
      baseUrl: account.baseUrl || getDefaultBaseUrl(account.environment),
      login: account.login,
      omsId: account.omsId,
      status: account.status,
      message: 'Аккаунт успешно добавлен',
    });
  } catch (error: any) {
    logger.error('Failed to create markirovka account:', error);
    return res.status(500).json({ message: 'Ошибка создания аккаунта маркировки' });
  }
}

export async function updateAccount(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { name, environment, baseUrl, login, password, omsId, status } = req.body;

    const existing = await prisma.markirovkaAccount.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Аккаунт не найден' });
    }

    if (user?.role !== 'ADMIN' && existing.userId !== user?.id) {
      return res.status(403).json({ message: 'Нет доступа к данному аккаунту' });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (environment) {
      updateData.environment = environment === 'PROD' ? MarkirovkaEnvironment.PROD : MarkirovkaEnvironment.TEST;
    }
    if (baseUrl !== undefined) updateData.baseUrl = baseUrl ? baseUrl.trim() : null;
    if (login) updateData.login = login.trim();
    if (password && password.trim().length > 0) {
      updateData.encryptedPassword = encryptText(password.trim());
      updateData.token = null;
      updateData.tokenExpiresAt = null;
    }
    if (omsId !== undefined) updateData.omsId = omsId ? omsId.trim() : null;
    if (status) updateData.status = status;

    const updated = await prisma.markirovkaAccount.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      id: updated.id,
      name: updated.name,
      environment: updated.environment,
      baseUrl: updated.baseUrl || getDefaultBaseUrl(updated.environment),
      login: updated.login,
      omsId: updated.omsId,
      status: updated.status,
      message: 'Аккаунт обновлен',
    });
  } catch (error: any) {
    logger.error('Failed to update markirovka account:', error);
    return res.status(500).json({ message: 'Ошибка обновления аккаунта маркировки' });
  }
}

export async function deleteAccount(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const existing = await prisma.markirovkaAccount.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Аккаунт не найден' });
    }

    if (user?.role !== 'ADMIN' && existing.userId !== user?.id) {
      return res.status(403).json({ message: 'Нет доступа к данному аккаунту' });
    }

    await prisma.markirovkaAccount.delete({ where: { id } });
    return res.json({ message: 'Аккаунт успешно удален' });
  } catch (error: any) {
    logger.error('Failed to delete markirovka account:', error);
    return res.status(500).json({ message: 'Ошибка удаления аккаунта маркировки' });
  }
}

export async function testConnection(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id, environment, baseUrl, login, password, omsId } = req.body;

    let accountRecord: any;

    if (id) {
      accountRecord = await prisma.markirovkaAccount.findUnique({ where: { id } });
      if (!accountRecord) {
        return res.status(404).json({ success: false, message: 'Аккаунт не найден' });
      }
      if (user?.role !== 'ADMIN' && accountRecord.userId !== user?.id) {
        return res.status(403).json({ success: false, message: 'Нет доступа к данному аккаунту' });
      }
    } else {
      if (!login || !password) {
        return res.status(400).json({ success: false, message: 'Укажите логин и пароль для проверки' });
      }
      accountRecord = {
        id: 'temp-check',
        name: 'Тестовая проверка',
        environment: environment === 'PROD' ? MarkirovkaEnvironment.PROD : MarkirovkaEnvironment.TEST,
        baseUrl: baseUrl?.trim() || null,
        login: login.trim(),
        encryptedPassword: encryptText(password.trim()),
        omsId: omsId?.trim() || null,
        status: 'ACTIVE',
        token: null,
        tokenExpiresAt: null,
      };
    }

    const client = new MarkirovkaClient(accountRecord);
    const result = await client.testConnection();

    return res.json(result);
  } catch (error: any) {
    logger.error('Test connection error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Ошибка выполнения проверки подключения',
    });
  }
}

export async function sandboxOrderCodes(req: Request, res: Response) {
  try {
    const { accountId, category, gtin, quantity, serialNumberType } = req.body;

    if (!accountId || !category || !gtin || !quantity) {
      return res.status(400).json({ message: 'Все параметры (accountId, category, gtin, quantity) обязательны' });
    }

    const account = await prisma.markirovkaAccount.findUnique({ where: { id: accountId } });
    if (!account) {
      return res.status(404).json({ message: 'Аккаунт маркировки не найден' });
    }

    const client = new MarkirovkaClient(account);
    const orderLog = await prisma.markirovkaOrder.create({
      data: {
        accountId,
        category: category as OrderCategory,
        gtin: gtin.trim(),
        quantityRequested: Number(quantity),
        status: 'PENDING',
      },
    });

    try {
      const emissionResult = await client.createEmissionOrder({
        category: category as OrderCategory,
        gtin: gtin.trim(),
        quantity: Number(quantity),
        serialNumberType: serialNumberType || 'OPERATOR',
      });

      // Small wait for IS MPT to generate codes in buffer
      await new Promise((r) => setTimeout(r, 1500));
      let fetchedCodes: string[] = [];
      try {
        fetchedCodes = await client.fetchCodes(
          emissionResult.orderId,
          gtin.trim(),
          Number(quantity),
          category as OrderCategory
        );
      } catch (fetchErr: any) {
        logger.warn(`Codes not yet ready for immediate download: ${fetchErr?.message}`);
      }

      const updatedOrder = await prisma.markirovkaOrder.update({
        where: { id: orderLog.id },
        data: {
          externalOrderId: emissionResult.orderId,
          quantityReceived: fetchedCodes.length,
          status: fetchedCodes.length > 0 ? 'COMPLETED' : 'READY',
          codes: fetchedCodes.length > 0 ? (fetchedCodes as any) : null,
        },
      });

      return res.json({
        success: true,
        orderId: emissionResult.orderId,
        status: updatedOrder.status,
        quantityRequested: Number(quantity),
        quantityReceived: fetchedCodes.length,
        codes: fetchedCodes,
        message:
          fetchedCodes.length > 0
            ? `Успешно получено ${fetchedCodes.length} кодов маркировки!`
            : `Заказ создан в ИС МПТ (ID: ${emissionResult.orderId}). Коды формируются на сервере.`,
      });
    } catch (orderErr: any) {
      await prisma.markirovkaOrder.update({
        where: { id: orderLog.id },
        data: {
          status: 'FAILED',
          errorDetails: orderErr.message,
        },
      });
      throw orderErr;
    }
  } catch (error: any) {
    logger.error('Sandbox order codes error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Ошибка создания заказа кодов в ИС МПТ',
    });
  }
}

export async function sandboxUtilisation(req: Request, res: Response) {
  try {
    const { accountId, category, gtin, codes, format, factoryName } = req.body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ message: 'Список кодов маркировки пуст' });
    }

    // Format download as CSV
    if (format === 'csv') {
      const csvData = MarkirovkaClient.generateUtilisationCsv(codes, gtin);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="utilisation_report_${category}_${Date.now()}.csv"`
      );
      return res.send(csvData);
    }

    if (!accountId) {
      return res.status(400).json({ message: 'Укажите accountId для отправки отчета в ИС МПТ' });
    }

    const account = await prisma.markirovkaAccount.findUnique({ where: { id: accountId } });
    if (!account) {
      return res.status(404).json({ message: 'Аккаунт маркировки не найден' });
    }

    const client = new MarkirovkaClient(account);
    const reportLog = await prisma.markirovkaUtilisationReport.create({
      data: {
        accountId,
        category: (category as OrderCategory) || 'OTHER',
        gtin: gtin || null,
        codesCount: codes.length,
        status: 'SUBMITTED',
        reportData: { codesCount: codes.length, sampleCode: codes[0] } as any,
      },
    });

    try {
      const result = await client.submitUtilisationReport({
        category: (category as OrderCategory) || 'OTHER',
        gtin,
        codes,
        factoryName,
      });

      await prisma.markirovkaUtilisationReport.update({
        where: { id: reportLog.id },
        data: {
          externalReportId: result.reportId,
          status: 'ACCEPTED',
          submittedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        reportId: result.reportId,
        codesCount: codes.length,
        message: `Отчет о нанесении ${codes.length} кодов успешно принят ИС МПТ!`,
      });
    } catch (reportErr: any) {
      await prisma.markirovkaUtilisationReport.update({
        where: { id: reportLog.id },
        data: {
          status: 'REJECTED',
          errorDetails: reportErr.message,
        },
      });
      throw reportErr;
    }
  } catch (error: any) {
    logger.error('Sandbox utilisation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Ошибка отправки отчета о нанесении',
    });
  }
}

export async function getRecentActivity(req: Request, res: Response) {
  try {
    const orders = await prisma.markirovkaOrder.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        account: {
          select: { name: true, environment: true, login: true },
        },
      },
    });

    const reports = await prisma.markirovkaUtilisationReport.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        account: {
          select: { name: true, environment: true, login: true },
        },
      },
    });

    return res.json({ orders, reports });
  } catch (error: any) {
    logger.error('Failed to get markirovka recent activity:', error);
    return res.status(500).json({ message: 'Ошибка получения истории активности' });
  }
}

export async function generateLabelsPdf(req: Request, res: Response) {
  try {
    const { codes, gtin, orderId, templateType = '58x40' } = req.body;
    let codesList: string[] = Array.isArray(codes) ? codes : [];

    if (codesList.length === 0 && orderId) {
      const markOrder = await prisma.markirovkaOrder.findUnique({ where: { id: String(orderId) } });
      if (markOrder?.codes && Array.isArray(markOrder.codes)) {
        codesList = markOrder.codes as string[];
      } else {
        const codeItems = await prisma.orderCodeItem.findMany({
          where: { orderId: String(orderId) },
          orderBy: { index: 'asc' },
          select: { code: true },
        });
        codesList = codeItems.map((c) => c.code);
      }
    }

    if (codesList.length === 0) {
      return res.status(400).json({ message: 'Список кодов маркировки пуст' });
    }

    const is58x40 = templateType === '58x40';
    const widthMm = is58x40 ? 58 : 40;
    const heightMm = is58x40 ? 40 : 30;

    const template = {
      widthMm,
      heightMm,
      elements: is58x40
        ? [
            { id: '1', type: 'datamatrix', x: 2, y: 5, size: 28, columnName: 'code', matrixStructure: 'four_regions' },
            { id: '2', type: 'text', x: 31, y: 5, width: 25, content: 'GTIN:\n{gtin}', fontSize: 7, fontWeight: 'bold', align: 'left' },
            { id: '3', type: 'text', x: 31, y: 15, width: 25, content: 'СЕРИЯ:\n{serial}', fontSize: 6, fontWeight: 'normal', align: 'left' },
            { id: '4', type: 'symbol', x: 42, y: 26, size: 10, symbolType: 'EAC' },
          ]
        : [
            { id: '1', type: 'datamatrix', x: 2, y: 3, size: 24, columnName: 'code', matrixStructure: 'four_regions' },
            { id: '2', type: 'text', x: 27, y: 4, width: 12, content: '{gtin}', fontSize: 6, fontWeight: 'bold', align: 'left' },
            { id: '3', type: 'symbol', x: 28, y: 18, size: 8, symbolType: 'EAC' },
          ],
    };

    const rows = codesList.map((codeStr) => {
      let codeGtin = gtin || '';
      let codeSerial = '';
      if (codeStr.startsWith('01') && codeStr.length >= 16) {
        codeGtin = codeStr.slice(2, 16);
      }
      if (codeStr.includes('21')) {
        const after21 = codeStr.split('21')[1] || '';
        codeSerial = after21.split('\u001d')[0].slice(0, 13);
      }
      return {
        code: codeStr,
        gtin: codeGtin,
        serial: codeSerial,
      };
    });

    const payload = JSON.stringify({ template, csvData: rows });
    const host = process.env.LABEL_GENERATOR_HOST || 'label-generator';
    const port = parseInt(process.env.LABEL_GENERATOR_PORT || '5060', 10);

    const proxyReq = http.request(
      {
        hostname: host,
        port,
        path: '/api/labels/generate-pdf',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="tanbox-labels-${widthMm}x${heightMm}-${Date.now()}.pdf"`,
        });
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', (err) => {
      logger.error('Label generator error in generateLabelsPdf:', err);
      if (!res.headersSent) {
        res.status(502).json({ message: 'Ошибка сервиса печати этикеток' });
      }
    });

    proxyReq.write(payload);
    proxyReq.end();
  } catch (error: any) {
    logger.error('generateLabelsPdf error:', error);
    return res.status(500).json({ message: error.message || 'Ошибка генерации PDF этикеток' });
  }
}

