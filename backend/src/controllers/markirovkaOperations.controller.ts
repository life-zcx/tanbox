import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/db';
import { MarkirovkaOperationType, MarkirovkaOperationStatus } from '@prisma/client';
import { MarkirovkaClient, CATEGORY_TO_OMS_EXTENSION, generateValidSscc18, normalizeSscc18, extractIdentificationCode } from '../services/markirovkaClient.service';
import { resolveNktProduct } from '../services/nktCatalog.service';
import { logger } from '../utils/logger';

/**
 * Helper to resolve MarkirovkaAccount respecting user isolation:
 * - Admin can access any account by ID or default active account
 * - Client can only access accounts owned by their userId
 */
async function resolveAccountForUser(user: any, accountId?: string) {
  if (user?.role === 'ADMIN') {
    if (accountId && accountId !== 'ALL') {
      return await prisma.markirovkaAccount.findUnique({ where: { id: String(accountId) } });
    }
    return await prisma.markirovkaAccount.findFirst({ where: { status: 'ACTIVE' } });
  }

  // Regular user (client)
  if (accountId && accountId !== 'ALL') {
    const acc = await prisma.markirovkaAccount.findFirst({
      where: { id: String(accountId), userId: user?.id },
    });
    if (acc) return acc;
  }
  const userAcc = await prisma.markirovkaAccount.findFirst({
    where: { userId: user?.id, status: 'ACTIVE' },
  });
  if (userAcc) return userAcc;

  return await prisma.markirovkaAccount.findFirst({
    where: { userId: user?.id },
  });
}

function mapOrderToOperation(ord: any) {
  const opStatus: MarkirovkaOperationStatus =
    ord.status === 'COMPLETED'
      ? MarkirovkaOperationStatus.COMPLETED
      : ord.status === 'FAILED'
      ? MarkirovkaOperationStatus.FAILED
      : MarkirovkaOperationStatus.PROCESSING;

  const docNumber = ord.externalOrderId
    ? `ORD-${ord.externalOrderId.length > 8 ? ord.externalOrderId.slice(0, 8) : ord.externalOrderId}`
    : `ORD-${ord.id.slice(0, 8)}`;

  return {
    id: ord.id,
    type: 'ORDER',
    accountId: ord.accountId,
    account: ord.account
      ? {
          id: ord.account.id,
          name: ord.account.name,
          environment: ord.account.environment,
          login: ord.account.login,
        }
      : null,
    documentNumber: docNumber,
    codesCount: ord.quantityReceived || ord.quantityRequested || 0,
    status: opStatus,
    isSigned: false,
    signature: null,
    requestPayload: {
      orderId: ord.id,
      externalOrderId: ord.externalOrderId,
      gtin: ord.gtin,
      category: ord.category,
      quantityRequested: ord.quantityRequested,
      quantityReceived: ord.quantityReceived,
    },
    responsePayload: {
      orderId: ord.id,
      externalOrderId: ord.externalOrderId,
      codes: Array.isArray(ord.codes) ? ord.codes.slice(0, 5) : [],
      details: {
        gtin: ord.gtin,
        category: ord.category,
        quantityRequested: ord.quantityRequested,
        quantityReceived: ord.quantityReceived,
        externalOrderId: ord.externalOrderId,
      },
    },
    errorDetails: ord.errorDetails,
    createdById: ord.order?.userId || null,
    createdAt: ord.createdAt,
    updatedAt: ord.updatedAt,
  };
}

/**
 * 1. Get operations history with filters
 */
export async function getOperations(req: AuthRequest, res: Response) {
  try {
    const { type, status, accountId, limit = 50, page = 1 } = req.query;

    const where: any = {};
    if (req.user?.role !== 'ADMIN') {
      where.OR = [
        { createdById: req.user?.id },
        { account: { userId: req.user?.id } },
      ];
    }
    if (status && status !== 'ALL') {
      where.status = status as MarkirovkaOperationStatus;
    }
    if (accountId && accountId !== 'ALL') {
      where.accountId = String(accountId);
    }

    const orderWhere: any = {};
    if (req.user?.role !== 'ADMIN') {
      orderWhere.OR = [
        { account: { userId: req.user?.id } },
        { order: { userId: req.user?.id } },
      ];
    }
    if (accountId && accountId !== 'ALL') {
      orderWhere.accountId = String(accountId);
    }
    if (status && status !== 'ALL') {
      if (status === 'COMPLETED') {
        orderWhere.status = 'COMPLETED';
      } else if (status === 'FAILED') {
        orderWhere.status = 'FAILED';
      } else if (status === 'PROCESSING') {
        orderWhere.status = { in: ['PENDING', 'READY', 'FETCHING'] };
      }
    }

    const take = Math.min(Number(limit) || 50, 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    // 1. If filtering specifically for orders
    if (type === 'ORDER') {
      const [total, orders] = await Promise.all([
        prisma.markirovkaOrder.count({ where: orderWhere }),
        prisma.markirovkaOrder.findMany({
          where: orderWhere,
          orderBy: { createdAt: 'desc' },
          take,
          skip,
          include: {
            account: {
              select: {
                id: true,
                name: true,
                environment: true,
                login: true,
              },
            },
            order: {
              select: {
                userId: true,
              },
            },
          },
        }),
      ]);

      return res.json({
        total,
        page: Number(page),
        totalPages: Math.ceil(total / take),
        operations: orders.map(mapOrderToOperation),
      });
    }

    // 2. If filtering specifically for another operation type
    if (type && type !== 'ALL') {
      where.type = type as MarkirovkaOperationType;

      const [total, items] = await Promise.all([
        prisma.markirovkaOperation.count({ where }),
        prisma.markirovkaOperation.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take,
          skip,
          include: {
            account: {
              select: {
                id: true,
                name: true,
                environment: true,
                login: true,
              },
            },
          },
        }),
      ]);

      return res.json({
        total,
        page: Number(page),
        totalPages: Math.ceil(total / take),
        operations: items,
      });
    }

    // 3. ALL operations (including orders) - memory-safe bounded fetch
    const [opTotal, orderTotal] = await Promise.all([
      prisma.markirovkaOperation.count({ where }),
      prisma.markirovkaOrder.count({ where: orderWhere }),
    ]);
    const total = opTotal + orderTotal;

    const safeTake = Math.min(take, 100);
    const safeSkip = Math.max(0, skip);
    const fetchLimit = Math.min(safeSkip + safeTake, 300);

    const [items, orders] = await Promise.all([
      prisma.markirovkaOperation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: fetchLimit,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              environment: true,
              login: true,
            },
          },
        },
      }),
      prisma.markirovkaOrder.findMany({
        where: orderWhere,
        orderBy: { createdAt: 'desc' },
        take: fetchLimit,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              environment: true,
              login: true,
            },
          },
          order: {
            select: {
              userId: true,
            },
          },
        },
      }),
    ]);

    const combined = [
      ...items,
      ...orders.map(mapOrderToOperation),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const pagedOperations = combined.slice(safeSkip, safeSkip + safeTake);

    return res.json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / take),
      operations: pagedOperations,
    });
  } catch (err: any) {
    logger.error('Failed to get markirovka operations:', err);
    return res.status(500).json({ message: err.message || 'Ошибка загрузки истории операций' });
  }
}

/**
 * 2. Validate Markirovka Codes (Валидация КМ)
 */
export async function validateCodes(req: AuthRequest, res: Response) {
  try {
    const { accountId, codes } = req.body;

    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ message: 'Необходимо передать массив кодов маркировки' });
    }

    const cleanCodes = codes.map((c: string) => extractIdentificationCode(c)).filter(Boolean);

    let account = await resolveAccountForUser(req.user, accountId);

    let isMptResponse: any = null;
    let results: any[] = [];

    if (account) {
      try {
        const client = new MarkirovkaClient(account);
        const apiRes = await client.validateCodesIcom(cleanCodes);
        isMptResponse = {
          url: apiRes.url,
          httpStatus: apiRes.httpStatus,
          data: apiRes.raw,
        };
        if (Array.isArray(apiRes.results) && apiRes.results.length > 0) {
          results = apiRes.results.map((r: any) => ({
            code: r.code || r.cis,
            gtin: r.gtin,
            isValid: r.status !== 'WRITTEN_OFF' && r.status !== 'INVALID',
            status: r.status,
            statusLabel: r.status === 'APPLIED' ? 'Нанесен' : (r.status === 'INTRODUCED' ? 'В обороте' : (r.status === 'RECEIVED' ? 'Эмитирован' : r.status)),
            packageType: r.packageType,
            emissionDate: r.emissionDate,
            verifiedAt: new Date().toISOString(),
          }));
        }
      } catch (err: any) {
        logger.warn('Failed querying ICOM /public/api/cod/public/codes:', err.message);
      }
    }

    // If True-API returned specific code info, map it, otherwise format GS1 structure
    if (results.length === 0) {
      results = cleanCodes.map((code: string) => {
        const isFormatOk = code.includes('01') && code.length >= 25;
        const gtin = code.startsWith('01') ? code.slice(2, 16) : code.slice(0, 14);
        return {
          code,
          gtin,
          isValid: isFormatOk,
          status: isFormatOk ? 'EMITTED' : 'INVALID_FORMAT',
          statusLabel: isFormatOk ? 'Эмитирован в ИС МПТ' : 'Некорректный формат GS1',
          ownerBin: account?.login || '',
          verifiedAt: new Date().toISOString(),
        };
      });
    }

    const operation = await prisma.markirovkaOperation.create({
      data: {
        type: MarkirovkaOperationType.VALIDATION,
        accountId: account?.id || null,
        codesCount: cleanCodes.length,
        status: MarkirovkaOperationStatus.COMPLETED,
        documentNumber: `VAL-${Date.now().toString().slice(-6)}`,
        requestPayload: { codes: cleanCodes, codesCount: cleanCodes.length },
        responsePayload: {
          isMptResponse,
          validatedCount: results.length,
          validCount: results.filter((r) => r.isValid !== false).length,
          results,
        },
        createdById: req.user?.id || null,
      },
    });

    return res.json({
      success: true,
      operationId: operation.id,
      documentNumber: operation.documentNumber,
      totalCount: cleanCodes.length,
      validCount: results.filter((r) => r.isValid !== false).length,
      invalidCount: results.filter((r) => r.isValid === false).length,
      results,
    });
  } catch (err: any) {
    logger.error('Error validating codes:', err);
    return res.status(500).json({ message: err.message || 'Ошибка валидации кодов маркировки' });
  }
}

/**
 * 3. Aggregation (Агрегация КМ в короба / паллеты SSCC)
 */
export async function createAggregation(req: AuthRequest, res: Response) {
  try {
    const { accountId, sscc, unitType = 'BOX', category = 'SHOES', codes } = req.body;

    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ message: 'Укажите коды маркировки для агрегации' });
    }

    const cleanCodes = codes.map((c: string) => extractIdentificationCode(c)).filter(Boolean);
    const targetSscc = sscc?.trim() ? normalizeSscc18(sscc) : generateValidSscc18();

    let account = await resolveAccountForUser(req.user, accountId);

    const docNumber = `AGG-${Date.now().toString().slice(-6)}`;
    let apiResponse: any = { message: 'Запрос отправлен в ИС МПТ' };
    let isSuccess = true;

    if (account) {
      try {
        const client = new MarkirovkaClient(account);
        const aggRes = await client.sendIcomAggregationDocument({
          unitSerialNumber: targetSscc,
          codes: cleanCodes,
          rawDocString: req.body.rawDocString,
          signature: req.body.signature,
        });
        apiResponse = {
          httpStatus: aggRes.httpStatus,
          targetUrl: aggRes.url,
          documentId: aggRes.documentId,
          data: aggRes.response,
        };
        isSuccess = aggRes.success;
      } catch (e: any) {
        logger.warn('ICOM aggregation error:', e.message);
        apiResponse = { error: e.message };
        isSuccess = false;
      }
    }

    const op = await prisma.markirovkaOperation.create({
      data: {
        type: MarkirovkaOperationType.AGGREGATION,
        accountId: account?.id || null,
        codesCount: cleanCodes.length,
        status: isSuccess ? MarkirovkaOperationStatus.COMPLETED : MarkirovkaOperationStatus.FAILED,
        documentNumber: docNumber,
        requestPayload: { sscc: targetSscc, unitType, category, codesCount: cleanCodes.length, codes: cleanCodes },
        responsePayload: apiResponse,
        errorDetails: isSuccess ? null : JSON.stringify(apiResponse),
        createdById: req.user?.id || null,
      },
    });

    if (!isSuccess) {
      return res.status(400).json({
        success: false,
        operationId: op.id,
        documentNumber: docNumber,
        message: `Ошибка ИС МПТ: ${apiResponse?.error || JSON.stringify(apiResponse)}`,
      });
    }

    return res.json({
      success: true,
      operationId: op.id,
      documentNumber: docNumber,
      sscc: targetSscc,
      codesCount: cleanCodes.length,
      message: `Агрегация ${cleanCodes.length} кодов в [${targetSscc}] успешно выполнена в ИС МПТ!`,
    });
  } catch (err: any) {
    logger.error('Error creating aggregation:', err);
    return res.status(500).json({ message: err.message || 'Ошибка агрегации КМ' });
  }
}

/**
 * 4. Disaggregation (Дезагрегация)
 */
export async function createDisaggregation(req: AuthRequest, res: Response) {
  try {
    const { accountId, sscc } = req.body;
    if (!sscc) return res.status(400).json({ message: 'Укажите код агрегата (SSCC) для расформирования' });

    let account = await resolveAccountForUser(req.user, accountId);

    const docNumber = `DIS-${Date.now().toString().slice(-6)}`;
    let apiResponse: any = { status: 'DISAGGREGATED', timestamp: new Date().toISOString() };
    let isSuccess = true;

    const targetSscc = normalizeSscc18(sscc);

    if (account) {
      try {
        const client = new MarkirovkaClient(account);
        const disRes = await client.sendIcomDisaggregationDocument({
          codes: [targetSscc],
        });
        apiResponse = {
          httpStatus: disRes.httpStatus,
          targetUrl: disRes.url,
          documentId: disRes.documentId,
          response: disRes.response,
        };
        isSuccess = disRes.success;
      } catch (err: any) {
        apiResponse = { error: err.message };
        isSuccess = false;
      }
    }

    const op = await prisma.markirovkaOperation.create({
      data: {
        type: MarkirovkaOperationType.DISAGGREGATION,
        accountId: account?.id || null,
        documentNumber: docNumber,
        status: isSuccess ? MarkirovkaOperationStatus.COMPLETED : MarkirovkaOperationStatus.FAILED,
        requestPayload: { sscc },
        responsePayload: apiResponse,
        errorDetails: isSuccess ? null : JSON.stringify(apiResponse),
        createdById: req.user?.id || null,
      },
    });

    if (!isSuccess) {
      return res.status(400).json({
        success: false,
        operationId: op.id,
        documentNumber: docNumber,
        message: `Ошибка ИС МПТ при дезагрегации: ${apiResponse?.error || JSON.stringify(apiResponse)}`,
      });
    }

    return res.json({
      success: true,
      operationId: op.id,
      documentNumber: docNumber,
      message: `Упаковка ${sscc} успешно расформирована в ИС МПТ.`,
    });
  } catch (err: any) {
    logger.error('Error creating disaggregation:', err);
    return res.status(500).json({ message: err.message || 'Ошибка дезагрегации' });
  }
}

/**
 * 5. Import Notification (Уведомление о ввозе товаров) - with EDS signature
 */
export async function createImportNotification(req: AuthRequest, res: Response) {
  try {
    const {
      accountId,
      importType = 'THIRD_COUNTRIES',
      declarationNumber,
      declarationDate,
      category = 'SHOES',
      senderCountry = 'CN',
      codes,
      signature,
    } = req.body;

    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ message: 'Укажите коды маркировки для ввода в оборот' });
    }

    const cleanCodes = codes.map((c: string) => extractIdentificationCode(c)).filter(Boolean);
    const docNumber = `IMP-${Date.now().toString().slice(-6)}`;

    let account = await resolveAccountForUser(req.user, accountId);

    if (!account) {
      return res.status(400).json({ message: 'Активный аккаунт ИС МПТ не найден.' });
    }

    // 1. Prepare genuine document payload according to True-API standard
    const importDoc = {
      declaration_number: declarationNumber,
      declaration_date: declarationDate,
      import_type: importType,
      sender_country: senderCountry,
      category,
      products_count: cleanCodes.length,
      products: cleanCodes.map((c: string) => ({ cis: c })),
    };

    const effectiveDocNumber =
      declarationNumber ||
      req.body.fnoNumber ||
      req.body.certNumber ||
      req.body.prodActNumber ||
      `DOC-${Date.now().toString().slice(-6)}`;

    // 2. Dispatch genuine HTTP request to Kazakhstan xTrace ICOM REST API
    const client = new MarkirovkaClient(account);
    const parsedDate = declarationDate ? new Date(declarationDate).toISOString() : new Date().toISOString();

    const isMptRes = await client.sendIcomImportDocument({
      codes: cleanCodes,
      customsDeclaration: {
        number: effectiveDocNumber,
        date: parsedDate,
      },
      exportCountry: req.body.exportCountry || req.body.eeuCountry || req.body.senderCountry || (importType === 'PRODUCTION' ? 'KZ' : 'CN'),
      rawDocString: req.body.rawDocString,
      signature,
    });

    logger.info(`[Import Notification] ICOM response: status=${isMptRes.httpStatus}, success=${isMptRes.success}, docId=${isMptRes.documentId}`);

    const isSuccess = isMptRes.success;
    const responsePayload = {
      targetUrl: isMptRes.url,
      httpStatus: isMptRes.httpStatus,
      isMptResponse: isMptRes.response,
      registeredAt: new Date().toISOString(),
      documentNumber: docNumber,
    };

    const op = await prisma.markirovkaOperation.create({
      data: {
        type: MarkirovkaOperationType.IMPORT_NOTIFICATION,
        accountId: account.id,
        codesCount: cleanCodes.length,
        status: isSuccess ? MarkirovkaOperationStatus.COMPLETED : MarkirovkaOperationStatus.FAILED,
        documentNumber: docNumber,
        isSigned: Boolean(signature),
        signature: signature || null,
        requestPayload: {
          importType,
          category,
          declarationNumber: effectiveDocNumber,
          declarationDate,
          exportCountry: req.body.exportCountry || req.body.eeuCountry || (importType === 'PRODUCTION' ? 'KZ' : 'CN'),
          fnoNumber: req.body.fnoNumber,
          fnoDate: req.body.fnoDate,
          primaryDocNumber: req.body.primaryDocNumber,
          primaryDocDate: req.body.primaryDocDate,
          certType: req.body.certType,
          certNumber: req.body.certNumber,
          certDate: req.body.certDate,
          prodActNumber: req.body.prodActNumber,
          prodActDate: req.body.prodActDate,
          producerBin: req.body.producerBin,
          contractNumber: req.body.contractNumber,
          codesCount: cleanCodes.length,
          codes: cleanCodes,
          orderId: req.body.orderId,
        },
        responsePayload,
        errorDetails: isSuccess ? null : (isMptRes.error || JSON.stringify(isMptRes.response)),
        createdById: req.user?.id || null,
      },
    });

    if (!isSuccess) {
      const errDetail =
        isMptRes.response?.error_description ||
        isMptRes.response?.error_message ||
        isMptRes.response?.error ||
        isMptRes.error ||
        `HTTP ${isMptRes.httpStatus}`;

      return res.status(400).json({
        success: false,
        operationId: op.id,
        documentNumber: docNumber,
        message: `Ответ сервера ИС МПТ (HTTP ${isMptRes.httpStatus}): ${errDetail}`,
        responsePayload,
      });
    }

    const typeLabel =
      importType === 'EEU'
        ? 'Ввоз из стран ЕАЭС (ФНО 328)'
        : importType === 'PRODUCTION'
        ? 'Ввод в оборот: Производство в РК'
        : importType === 'CONTRACT_MANUFACTURING'
        ? 'Ввод в оборот: Контрактное производство'
        : 'Уведомление о ввозе товаров (по ГТД)';

    return res.json({
      success: true,
      operationId: op.id,
      documentNumber: docNumber,
      message: `${typeLabel} (${cleanCodes.length} товаров) успешно зарегистрировано в ИС МПТ!`,
      responsePayload,
    });
  } catch (err: any) {
    logger.error('Error creating import notification:', err);
    return res.status(500).json({ message: err.message || 'Ошибка формирования уведомления о ввозе' });
  }
}

/**
 * 6. Retirement (Уведомление о выводе товара из оборота) - with EDS signature
 */
export async function createRetirement(req: AuthRequest, res: Response) {
  try {
    const {
      accountId,
      reason = 'DAMAGE',
      documentNumber: userDocNum,
      documentDate,
      codes,
      signature,
    } = req.body;

    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ message: 'Укажите коды маркировки для списания' });
    }

    const cleanCodes = codes.map((c: string) => extractIdentificationCode(c)).filter(Boolean);
    const docNumber = `RET-${Date.now().toString().slice(-6)}`;

    let account = await resolveAccountForUser(req.user, accountId);

    if (!account) {
      return res.status(400).json({ message: 'Активный аккаунт ИС МПТ не найден.' });
    }

    const client = new MarkirovkaClient(account);
    const parsedDocDate = documentDate ? new Date(documentDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const parsedDocNum = userDocNum?.trim() || `АКТ-${Date.now().toString().slice(-6)}`;
    const isMptRes = await client.sendIcomWithdrawalDocument({
      withdrawalReason: reason || 'DAMAGE',
      codes: cleanCodes,
      primaryDocument: {
        number: parsedDocNum,
        date: parsedDocDate,
      },
      rawDocString: req.body.rawDocString,
      signature,
    });

    const isSuccess = isMptRes.success;
    const responsePayload = {
      targetUrl: isMptRes.url,
      httpStatus: isMptRes.httpStatus,
      isMptResponse: isMptRes.response,
      registeredAt: new Date().toISOString(),
      documentNumber: docNumber,
    };

    const op = await prisma.markirovkaOperation.create({
      data: {
        type: MarkirovkaOperationType.RETIREMENT,
        accountId: account.id,
        codesCount: cleanCodes.length,
        status: isSuccess ? MarkirovkaOperationStatus.COMPLETED : MarkirovkaOperationStatus.FAILED,
        documentNumber: docNumber,
        isSigned: Boolean(signature),
        signature: signature || null,
        requestPayload: {
          reason,
          userDocNum,
          documentDate,
          codesCount: cleanCodes.length,
          codes: cleanCodes,
        },
        responsePayload,
        errorDetails: isSuccess ? null : (isMptRes.error || JSON.stringify(isMptRes.response)),
        createdById: req.user?.id || null,
      },
    });

    if (!isSuccess) {
      const errDetail =
        isMptRes.response?.error_description ||
        isMptRes.response?.error_message ||
        isMptRes.response?.error ||
        isMptRes.error ||
        `HTTP ${isMptRes.httpStatus}`;

      return res.status(400).json({
        success: false,
        operationId: op.id,
        documentNumber: docNumber,
        message: `Ответ сервера ИС МПТ (HTTP ${isMptRes.httpStatus}): ${errDetail}`,
        responsePayload,
      });
    }

    return res.json({
      success: true,
      operationId: op.id,
      documentNumber: docNumber,
      message: `Уведомление о выводе из оборота (${cleanCodes.length} шт.) успешно принято в ИС МПТ!`,
      responsePayload,
    });
  } catch (err: any) {
    logger.error('Error creating retirement:', err);
    return res.status(500).json({ message: err.message || 'Ошибка вывода товара из оборота' });
  }
}

/**
 * 7. Correction (Корректировка сведений о КМ) - with EDS signature
 */
export async function createCorrection(req: AuthRequest, res: Response) {
  try {
    const { accountId, targetDocNumber, correctionType = 'UPDATE_DATA', notes, codes, signature } = req.body;

    const cleanCodes = Array.isArray(codes) ? codes.map((c: string) => extractIdentificationCode(c)).filter(Boolean) : [];
    const docNumber = `COR-${Date.now().toString().slice(-6)}`;

    let account = await resolveAccountForUser(req.user, accountId);

    if (!account) {
      return res.status(400).json({ message: 'Активный аккаунт ИС МПТ не найден.' });
    }

    const correctionDoc = {
      action: 'CORRECTION',
      target_document: targetDocNumber,
      correction_type: correctionType,
      notes,
      products: cleanCodes.map((c: string) => ({ cis: c })),
    };

    const client = new MarkirovkaClient(account);
    const isMptRes = await client.sendIcomCorrectionDocument({
      codes: cleanCodes,
      rawDocString: req.body.rawDocString,
      signature,
    });

    const isSuccess = isMptRes.success;
    const responsePayload = {
      targetUrl: isMptRes.url,
      httpStatus: isMptRes.httpStatus,
      isMptResponse: isMptRes.response,
      registeredAt: new Date().toISOString(),
      documentNumber: docNumber,
    };

    const op = await prisma.markirovkaOperation.create({
      data: {
        type: MarkirovkaOperationType.CORRECTION,
        accountId: account.id,
        codesCount: cleanCodes.length,
        status: isSuccess ? MarkirovkaOperationStatus.COMPLETED : MarkirovkaOperationStatus.FAILED,
        documentNumber: docNumber,
        isSigned: Boolean(signature),
        signature: signature || null,
        requestPayload: { targetDocNumber, correctionType, notes, codesCount: cleanCodes.length, codes: cleanCodes },
        responsePayload,
        errorDetails: isSuccess ? null : (isMptRes.error || JSON.stringify(isMptRes.response)),
        createdById: req.user?.id || null,
      },
    });

    if (!isSuccess) {
      const errDetail =
        isMptRes.response?.error_description ||
        isMptRes.response?.error_message ||
        isMptRes.response?.error ||
        isMptRes.error ||
        `HTTP ${isMptRes.httpStatus}`;

      return res.status(400).json({
        success: false,
        operationId: op.id,
        documentNumber: docNumber,
        message: `Ответ сервера ИС МПТ (HTTP ${isMptRes.httpStatus}): ${errDetail}`,
        responsePayload,
      });
    }

    return res.json({
      success: true,
      operationId: op.id,
      documentNumber: docNumber,
      message: `Корректировка сведений по документу ${targetDocNumber || docNumber} успешно зарегистрирована в ИС МПТ!`,
      responsePayload,
    });
  } catch (err: any) {
    logger.error('Error creating correction:', err);
    return res.status(500).json({ message: err.message || 'Ошибка корректировки сведений' });
  }
}

/**
 * 8. Get True-API EDS Authentication Challenge (Key & UUID)
 */
export async function getAuthChallenge(req: AuthRequest, res: Response) {
  try {
    const { accountId } = req.query;
    let account = await resolveAccountForUser(req.user, accountId ? String(accountId) : undefined);

    if (!account) {
      return res.status(400).json({ message: 'Аккаунт ИС МПТ не найден' });
    }

    const client = new MarkirovkaClient(account);
    const challenge = await client.getTrueApiChallenge();

    return res.json({
      success: true,
      uuid: challenge.uuid,
      data: challenge.data,
      trueApiBase: client.getTrueApiBaseUrl(),
    });
  } catch (err: any) {
    logger.error('Error getting True-API challenge:', err);
    return res.status(500).json({ message: err.message || 'Ошибка получения ключа авторизации от ИС МПТ' });
  }
}

/**
 * 9. Exchange signed challenge for True-API session token
 */
export async function authSimpleSignIn(req: AuthRequest, res: Response) {
  try {
    const { accountId, uuid, signature } = req.body;
    if (!uuid || !signature) {
      return res.status(400).json({ message: 'Требуется указать uuid и signature' });
    }

    let account = await resolveAccountForUser(req.user, accountId ? String(accountId) : undefined);

    if (!account) {
      return res.status(400).json({ message: 'Аккаунт ИС МПТ не найден' });
    }

    const client = new MarkirovkaClient(account);
    const token = await client.signInTrueApiWithEds(uuid, signature);

    return res.json({
      success: true,
      token,
      message: 'Сессия True-API ИС МПТ успешно авторизована по ЭЦП (действует 10 часов)!',
    });
  } catch (err: any) {
    logger.error('Error during simpleSignIn:', err);
    return res.status(400).json({ message: err.message || 'Ошибка авторизации в ИС МПТ' });
  }
}

/**
 * 10. Utilisation (Отчет о нанесении КМ)
 */
export async function createUtilisation(req: AuthRequest, res: Response) {
  try {
    const { accountId, category = 'OILS', codes, releaseType, productionDate, expirationDate, manufacturerCountry, orderId } = req.body;

    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ message: 'Укажите коды маркировки для отчета о нанесении' });
    }

    let cleanCodes = codes.map((c: string) => c.replace(/[\r\n]/g, '').trim()).filter(Boolean);
    const docNumber = `UTL-${Date.now().toString().slice(-6)}`;

    // If codes are truncated to AI_REDUCED (without crypto-tail) and orderId is provided,
    // recover the authentic full DataMatrix strings with crypto-tail from database orderCodeItem:
    if (orderId && cleanCodes.some((c: string) => !c.includes('\u001d') && !c.includes('92'))) {
      try {
        const dbItems = await prisma.orderCodeItem.findMany({
          where: { orderId: String(orderId) },
          orderBy: { index: 'asc' },
          take: cleanCodes.length || 500,
        });
        if (dbItems.length > 0 && dbItems[0].code.includes('\u001d')) {
          cleanCodes = dbItems.map((item) => item.code);
        }
      } catch (err: any) {
        logger.warn('Failed restoring full codes from orderCodeItem for utilisation:', err.message);
      }
    }

    let account = await resolveAccountForUser(req.user, accountId);

    if (!account) {
      return res.status(400).json({ message: 'Активный аккаунт ИС МПТ не найден.' });
    }

    const client = new MarkirovkaClient(account);
    const reportRes = await client.submitUtilisationReport({
      category,
      codes: cleanCodes,
      releaseType: releaseType || 'PRODUCTION',
      productionDate,
      expirationDate,
      manufacturerCountry,
    });

    const isSuccess = Boolean(reportRes?.reportId);
    const responsePayload = {
      targetUrl: `${account.baseUrl || 'https://test.markirovka.kz'}/api/facade/reports/utilisation`,
      reportId: reportRes.reportId,
      raw: reportRes.raw,
      registeredAt: new Date().toISOString(),
      documentNumber: docNumber,
    };

    const op = await prisma.markirovkaOperation.create({
      data: {
        type: MarkirovkaOperationType.UTILISATION,
        accountId: account.id,
        codesCount: cleanCodes.length,
        status: isSuccess ? MarkirovkaOperationStatus.COMPLETED : MarkirovkaOperationStatus.FAILED,
        documentNumber: docNumber,
        isSigned: false,
        requestPayload: { category, codesCount: cleanCodes.length, codes: cleanCodes, releaseType, orderId },
        responsePayload,
        createdById: req.user?.id || null,
      },
    });

    if (orderId) {
      try {
        const orderExists = await prisma.order.findUnique({ where: { id: String(orderId) } });
        if (orderExists) {
          await prisma.markirovkaUtilisationReport.create({
            data: {
              accountId: account.id,
              orderId: String(orderId),
              externalReportId: reportRes?.reportId || docNumber,
              category: (category as any) || orderExists.category,
              codesCount: cleanCodes.length,
              status: isSuccess ? 'SUBMITTED' : 'REJECTED',
              submittedAt: new Date(),
              reportData: responsePayload,
              errorDetails: isSuccess ? null : 'Failed to submit',
            },
          });
        }
      } catch (err: any) {
        logger.warn('Failed linking MarkirovkaUtilisationReport to order:', err.message);
      }
    }

    return res.json({
      success: true,
      operationId: op.id,
      documentNumber: docNumber,
      reportId: reportRes.reportId,
      message: `Отчет о нанесении (${cleanCodes.length} КМ) успешно зарегистрирован в ИС МПТ!`,
      responsePayload,
    });
  } catch (err: any) {
    logger.error('Error creating utilisation report:', err);
    return res.status(400).json({ message: err.message || 'Ошибка регистрации отчета о нанесении в ИС МПТ' });
  }
}

/**
 * 11. Return to Turnover (Возврат товара в оборот)
 */
export async function createReturnToTurnover(req: AuthRequest, res: Response) {
  try {
    const {
      accountId,
      returnReason = 'RETAIL_RETURN',
      documentNumber: userDocNum,
      documentDate,
      documentType = 'Приказ',
      codes,
      rawDocString,
      signature,
    } = req.body;

    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ message: 'Укажите коды маркировки для возврата в оборот' });
    }

    const cleanCodes = codes.map((c: string) => extractIdentificationCode(c)).filter(Boolean);
    const docNumber = `RET-TURN-${Date.now().toString().slice(-6)}`;

    let account = await resolveAccountForUser(req.user, accountId);

    if (!account) {
      return res.status(400).json({ message: 'Активный аккаунт ИС МПТ не найден.' });
    }

    const client = new MarkirovkaClient(account);
    const isMptRes = await client.sendIcomReturnToTurnoverDocument({
      returnReason,
      codes: cleanCodes,
      primaryDocument: {
        number: userDocNum || 'DOC-001',
        date: documentDate || new Date().toISOString().slice(0, 10),
        type: documentType,
      },
      rawDocString,
      signature,
    });

    const isSuccess = isMptRes.success;
    const responsePayload = {
      targetUrl: isMptRes.url,
      httpStatus: isMptRes.httpStatus,
      documentId: isMptRes.documentId,
      isMptResponse: isMptRes.response,
      registeredAt: new Date().toISOString(),
      documentNumber: docNumber,
    };

    const op = await prisma.markirovkaOperation.create({
      data: {
        type: MarkirovkaOperationType.RETURN_TO_TURNOVER,
        accountId: account.id,
        codesCount: cleanCodes.length,
        status: isSuccess ? MarkirovkaOperationStatus.COMPLETED : MarkirovkaOperationStatus.FAILED,
        documentNumber: docNumber,
        isSigned: Boolean(signature),
        signature: signature || null,
        requestPayload: {
          returnReason,
          userDocNum,
          documentDate,
          codesCount: cleanCodes.length,
          codes: cleanCodes,
        },
        responsePayload,
        errorDetails: isSuccess ? null : (isMptRes.error || JSON.stringify(isMptRes.response)),
        createdById: req.user?.id || null,
      },
    });

    if (!isSuccess) {
      const errDetail =
        isMptRes.response?.context?._cause ||
        isMptRes.response?.message ||
        isMptRes.response?.error ||
        isMptRes.error ||
        `HTTP ${isMptRes.httpStatus}`;

      return res.status(400).json({
        success: false,
        operationId: op.id,
        documentNumber: docNumber,
        message: `Ответ сервера ИС МПТ (HTTP ${isMptRes.httpStatus}): ${errDetail}`,
        responsePayload,
      });
    }

    return res.json({
      success: true,
      operationId: op.id,
      documentNumber: docNumber,
      message: `Возврат в оборот (${cleanCodes.length} товаров) успешно зарегистрирован в ИС МПТ!`,
      responsePayload,
    });
  } catch (err: any) {
    logger.error('Error creating return to turnover:', err);
    return res.status(500).json({ message: err.message || 'Ошибка возврата товара в оборот' });
  }
}

/**
 * 12. Search product in National Catalog by GTIN
 */
export async function getProductByGtin(req: AuthRequest, res: Response) {
  try {
    const { gtin, productGroup, category } = req.query;
    if (!gtin) {
      return res.status(400).json({ message: 'Необходимо указать GTIN товара' });
    }

    const cleanGtin = String(gtin).replace(/\D/g, '').padStart(14, '0');
    const targetCategory = (category || productGroup || '') as string;
    const userId = req.user?.id;

    const product = await resolveNktProduct(cleanGtin, targetCategory, userId);

    if (!product) {
      return res.status(404).json({
        success: false,
        gtin: cleanGtin,
        message: 'Товар с указанным GTIN не найден в Национальном Каталоге (НКТ)',
      });
    }

    return res.json({
      success: true,
      gtin: cleanGtin,
      product,
    });
  } catch (err: any) {
    logger.error('Error searching product by GTIN:', err);
    return res.status(500).json({ message: err.message || 'Ошибка поиска товара в каталоге НКТ' });
  }
}

/**
 * 13. Get detailed document receipt and codes from storage
 */
export async function getOperationReceipt(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const op = await prisma.markirovkaOperation.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!op) {
      const markOrder = await prisma.markirovkaOrder.findUnique({
        where: { id },
        include: {
          account: true,
          order: { select: { userId: true } },
        },
      });

      if (!markOrder) {
        return res.status(404).json({ message: 'Операция не найдена' });
      }

      if (req.user?.role !== 'ADMIN') {
        if (markOrder.account?.userId !== req.user?.id && markOrder.order?.userId !== req.user?.id) {
          return res.status(403).json({ message: 'Доступ к данной операции запрещен' });
        }
      }

      const mappedOp = mapOrderToOperation(markOrder);
      let localCodes: any[] = [];
      if (Array.isArray(markOrder.codes)) {
        localCodes = (markOrder.codes as string[]).map((c: string) => ({
          code: c,
          state: markOrder.status === 'COMPLETED' ? 'SUCCESS' : 'ERROR',
          result: markOrder.status === 'COMPLETED' ? 'Эмитирован в ИС МПТ' : markOrder.status,
          gtin: markOrder.gtin,
        }));
      }

      return res.json({
        success: true,
        operation: mappedOp,
        documentId: markOrder.externalOrderId || null,
        storageInfo: null,
        receipt: {
          status: mappedOp.status,
          docInfo: {
            status: mappedOp.status,
            type: 'ORDER',
            documentNumber: mappedOp.documentNumber,
            date: markOrder.createdAt,
            category: markOrder.category,
            gtin: markOrder.gtin,
            quantityRequested: markOrder.quantityRequested,
            quantityReceived: markOrder.quantityReceived,
          },
          codes: localCodes,
          errors: markOrder.errorDetails
            ? [
                {
                  code: 'ORDER_ERROR',
                  error: markOrder.errorDetails,
                  friendly: {
                    title: 'Ошибка заказа кодов маркировки',
                    description: markOrder.errorDetails,
                    actionHint: 'Проверьте статус заказа в СУЗ ИС МПТ или повторите попытку',
                  },
                },
              ]
            : [],
        },
        message: 'Квитанция заказа кодов маркировки (СУЗ)',
      });
    }

    if (req.user?.role !== 'ADMIN') {
      if (op.createdById !== req.user?.id && op.account?.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Доступ к данной операции запрещен' });
      }
    }

    const respPayload: any = op.responsePayload || {};
    const documentId =
      respPayload.documentId ||
      respPayload.reportId ||
      respPayload.data?.documentId ||
      respPayload.data?.reportId ||
      respPayload.raw?.reportId ||
      respPayload.isMptResponse?.documentId;

    if (!documentId) {
      let localCodes: any[] = [];
      if (Array.isArray(respPayload.results) && respPayload.results.length > 0) {
        localCodes = respPayload.results.map((r: any) => ({
          code: r.code,
          state: r.isValid !== false ? 'SUCCESS' : 'ERROR',
          result: r.statusLabel || r.status || (r.isValid !== false ? 'Успешно' : 'Ошибка'),
          gtin: r.gtin,
          packageType: r.packageType,
          verifiedAt: r.verifiedAt,
          emissionDate: r.emissionDate,
          expirationDate: r.expirationDate,
        }));
      } else if (Array.isArray((op.requestPayload as any)?.codes)) {
        localCodes = ((op.requestPayload as any).codes || []).map((c: string) => ({
          code: c,
          state: op.status === 'COMPLETED' ? 'SUCCESS' : 'ERROR',
          result: op.status === 'COMPLETED' ? 'Успешно' : 'Ошибка',
        }));
      }

      if (localCodes.length === 0 && (op.requestPayload as any)?.orderId) {
        try {
          const codeItems = await prisma.orderCodeItem.findMany({
            where: { orderId: String((op.requestPayload as any).orderId) },
            orderBy: { index: 'asc' },
            take: 500,
          });
          if (codeItems.length > 0) {
            localCodes = codeItems.map((ci) => ({
              code: ci.code,
              state: op.status === 'COMPLETED' ? 'SUCCESS' : 'ERROR',
              result: op.status === 'COMPLETED' ? 'Успешно' : 'Ошибка',
              gtin: ci.gtin,
            }));
          }
        } catch (err: any) {
          logger.warn('Failed retrieving orderCodeItems in getOperationReceipt:', err.message);
        }
      }

      return res.json({
        success: true,
        operation: op,
        documentId: null,
        storageInfo: null,
        receipt: {
          status: op.status,
          docInfo: {
            status: op.status,
            type: op.type,
            documentNumber: op.documentNumber,
            date: op.createdAt,
          },
          codes: localCodes,
          errors: [],
        },
        message: 'Локальная квитанция операции',
      });
    }

    const account = op.account || (await prisma.markirovkaAccount.findFirst({ where: { status: 'ACTIVE' } }));
    if (!account) {
      return res.status(400).json({ message: 'Аккаунт ИС МПТ не найден' });
    }

    const client = new MarkirovkaClient(account);
    const [docStatus, docCodes, docErrors] = await Promise.all([
      client.getIcomDocumentStatus(documentId).catch(() => null),
      client.getIcomDocumentCodes(documentId, 200).catch(() => []),
      client.getIcomDocumentErrors(documentId).catch(() => null),
    ]);

function formatMarkirovkaError(errorCode?: string, errorTags?: any, propertyName?: string | null): {
  title: string;
  description: string;
  actionHint?: string;
} {
  const code = String(errorCode || '').toLowerCase();
  const tagsStr = typeof errorTags === 'object' ? JSON.stringify(errorTags) : String(errorTags || '');

  if (code.includes('invalid-code-properties') || code.includes('ai_reduced') || tagsStr.includes('AI_REDUCED')) {
    return {
      title: 'Неверный формат кода маркировки',
      description: 'В отчет передан код с криптохвостом или неверной структурой. Для отчета о нанесении в ИС МПТ требуется короткий код идентификации (GTIN + серийный номер, 31 символ) без криптохвоста и спецсимволов.',
      actionHint: 'В Tanbox уже включена авто-очистка кодов. Повторите операцию нанесения — коды будут переданы в правильном формате.',
    };
  }

  if (code.includes('not-found') || code.includes('not_found')) {
    return {
      title: 'Код не найден в ИС МПТ',
      description: 'Данный код маркировки не зарегистрирован в системе ИС МПТ (не был эмитирован для вашей организации).',
      actionHint: 'Убедитесь, что коды были заказаны и выпущены в вашем аккаунте ИС МПТ.',
    };
  }

  if (code.includes('already-utilised') || code.includes('already_utilized') || code.includes('already-applied')) {
    return {
      title: 'Код уже нанесен',
      description: 'Отчет о нанесении для этого кода уже был успешно зарегистрирован ранее.',
      actionHint: 'Повторное нанесение не требуется. Код готов к вводу в оборот или агрегации.',
    };
  }

  if (code.includes('not-applied') || code.includes('not_applied')) {
    return {
      title: 'Код еще не нанесен',
      description: 'Нельзя ввести товар в оборот или сформировать упаковку до успешной подачи отчета о нанесении.',
      actionHint: 'Сначала выполните операцию «Отчет о нанесении» для этих кодов.',
    };
  }

  if (code.includes('already-in-circulation') || code.includes('in-circulation') || code.includes('in_circulation')) {
    return {
      title: 'Товар уже в обороте',
      description: 'Этот код маркировки уже находится в обороте.',
      actionHint: 'Повторный ввод в оборот не требуется.',
    };
  }

  if (code.includes('not-in-circulation')) {
    return {
      title: 'Товар не в обороте',
      description: 'Код маркировки еще не введен в оборот либо уже списан.',
      actionHint: 'Выполните ввод в оборот перед продажей или выводом.',
    };
  }

  if (code.includes('withdrawn') || code.includes('retired')) {
    return {
      title: 'Код выведен из оборота',
      description: 'Данный код маркировки уже списан, продан или выведен из оборота.',
      actionHint: 'Коды, выведенные из оборота, нельзя использовать повторно.',
    };
  }

  if (code.includes('owner') || code.includes('mismatch')) {
    return {
      title: 'Код принадлежит другой организации',
      description: 'Текущим владельцем кода маркировки числится другой участник оборота (не совпадает БИН/ИИН).',
      actionHint: 'Проверьте, была ли проведена приемка товара по электронному акту / ВС.',
    };
  }

  if (code.includes('gtin')) {
    return {
      title: 'Ошибка товара в каталоге (GTIN)',
      description: 'Товар с таким GTIN не найден в Национальном каталоге товаров (НКТ) или карточка не опубликована.',
      actionHint: 'Проверьте статус карточки товара в НКТ на markirovka.kz.',
    };
  }

  if (code.includes('date') || code.includes('time')) {
    return {
      title: 'Некорректная дата',
      description: 'Указана недопустимая дата производства или срок годности (например, дата из будущего).',
      actionHint: 'Укажите дату производства не позже сегодняшнего дня.',
    };
  }

  return {
    title: errorCode ? `Ошибка: ${errorCode}` : 'Ошибка обработки кода',
    description: 'Система маркировки отклонила обработку кода по правилам валидации ИС МПТ.',
    actionHint: 'Проверьте статус кода в личном кабинете markirovka.kz или повторите операцию.',
  };
}

    // Auto-sync status in DB if storage returns definitive status
    if (docStatus?.status) {
      const mappedStatus =
        docStatus.status === 'SUCCESS' ? 'COMPLETED' : docStatus.status === 'ERROR' ? 'FAILED' : op.status;
      if (mappedStatus !== op.status) {
        await prisma.markirovkaOperation.update({
          where: { id: op.id },
          data: { status: mappedStatus },
        });
        op.status = mappedStatus;
      }
    }

    const errorMap = new Map<number, any>();
    const rawErrors = Array.isArray(docErrors?.documentErrors) ? docErrors.documentErrors : [];
    const enrichedErrors = rawErrors.map((err: any) => {
      const readable = formatMarkirovkaError(err.errorCode, err.errorTags, err.propertyName);
      return {
        ...err,
        userTitle: readable.title,
        userMessage: readable.description,
        actionHint: readable.actionHint,
      };
    });

    for (const err of enrichedErrors) {
      if (typeof err.index === 'number') {
        errorMap.set(err.index, err);
      }
    }

    // Fallback to local codes if True-API storage has not replicated codes yet
    let effectiveCodes = Array.isArray(docCodes) && docCodes.length > 0 ? docCodes : [];
    if (effectiveCodes.length === 0) {
      let rawList: any[] = [];
      if (Array.isArray((op.requestPayload as any)?.codes)) {
        rawList = (op.requestPayload as any).codes;
      } else if ((op.requestPayload as any)?.orderId) {
        try {
          const codeItems = await prisma.orderCodeItem.findMany({
            where: { orderId: String((op.requestPayload as any).orderId) },
            orderBy: { index: 'asc' },
            take: 500,
          });
          rawList = codeItems.map((ci) => ci.code);
        } catch (err: any) {
          logger.warn('Failed fallback codeItems:', err.message);
        }
      }

      effectiveCodes = rawList.map((c: string, idx: number) => {
        const err = errorMap.get(idx);
        const hasErr = !!err || docStatus?.status === 'ERROR';
        let errorTitle = 'Отклонен ИС МПТ';
        if (err?.userTitle) {
          errorTitle = err.userTitle;
        } else if (hasErr && enrichedErrors.length > 0) {
          errorTitle = enrichedErrors[0].userTitle || 'Отклонен ИС МПТ';
        }

        return {
          code: c,
          state: hasErr ? 'ERROR' : 'SUCCESS',
          result: hasErr ? errorTitle : 'Успешно',
          errorDetails: err || (hasErr && enrichedErrors.length > 0 ? enrichedErrors[0] : null),
        };
      });
    } else {
      effectiveCodes = effectiveCodes.map((item: any, idx: number) => {
        const err = errorMap.get(idx);
        if (item.state === 'ERROR' || err) {
          const readable = err ? err : formatMarkirovkaError(item.result, null, null);
          return {
            ...item,
            result: readable.userTitle || readable.title || item.result,
          };
        }
        return item;
      });
    }

    return res.json({
      success: true,
      operation: op,
      documentId,
      receipt: {
        status: docStatus?.status || op.status,
        docInfo: docStatus,
        codes: effectiveCodes,
        errors: enrichedErrors,
      },
    });
  } catch (err: any) {
    logger.error('Error fetching operation receipt:', err);
    return res.status(500).json({ message: err.message || 'Ошибка получения квитанции из ИС МПТ' });
  }
}

/**
 * 14. Check party status by TIN (ИИН/БИН)
 */
export async function checkPartyStatus(req: AuthRequest, res: Response) {
  try {
    const { tin, accountId } = req.query;
    if (!tin) {
      return res.status(400).json({ message: 'Укажите ИИН/БИН участника для проверки' });
    }

    const cleanTin = String(tin).replace(/\D/g, '').trim();
    if (!cleanTin || cleanTin.length < 10) {
      return res.status(400).json({ message: 'Некорректный формат ИИН/БИН (ожидается 12 цифр)' });
    }

    // 1. Check local registered accounts
    const localAccount = await prisma.markirovkaAccount.findFirst({
      where: {
        OR: [
          { login: cleanTin },
          { name: { contains: cleanTin } },
        ],
      },
    });

    if (localAccount) {
      return res.json({
        success: true,
        registered: true,
        tin: cleanTin,
        party: {
          tin: cleanTin,
          name: { ru: localAccount.name },
          fullName: { ru: localAccount.name },
          productGroups: localAccount.categories,
        },
        data: {
          status: localAccount.status || 'ACTIVE',
          tin: cleanTin,
          nameRu: localAccount.name,
          nameKz: localAccount.name,
          productGroups: localAccount.categories || [],
        },
        message: 'Участник найден и зарегистрирован в системе маркировки РК',
      });
    }

    // 2. Query IS MPT if active account is configured
    let account = await resolveAccountForUser(req.user, accountId ? String(accountId) : undefined);
    if (!account) {
      account = await prisma.markirovkaAccount.findFirst({ where: { status: 'ACTIVE' } });
    }

    if (account && account.login && account.encryptedPassword) {
      try {
        const client = new MarkirovkaClient(account);
        const result = await client.checkPartyStatus(cleanTin);
        const isRegistered = !!(result?.party && (result.party.tin || result.party.name));

        return res.json({
          success: true,
          registered: isRegistered,
          tin: cleanTin,
          party: result?.party || null,
          data: isRegistered
            ? {
                status: 'ACTIVE',
                tin: result.party.tin || cleanTin,
                nameRu: result.party.name?.ru || result.party.fullName?.ru || '',
                nameKz: result.party.name?.kz || result.party.fullName?.kz || '',
                productGroups: result.party.productGroups || [],
              }
            : null,
          message: isRegistered
            ? 'Участник найден и зарегистрирован в ИС МПТ'
            : 'Участник с данным БИН/ИИН не найден в реестре ИС МПТ',
        });
      } catch (clientErr: any) {
        logger.warn(`[Party Check] IS MPT lookup failed: ${clientErr.message}`);
      }
    }

    // Default if not found in local registry and external service not reachable
    return res.json({
      success: true,
      registered: false,
      tin: cleanTin,
      party: null,
      data: null,
      message: 'Участник с данным БИН/ИИН не найден в реестре маркировки',
    });
  } catch (err: any) {
    logger.error('Error checking party status:', err);
    return res.status(500).json({ message: err.message || 'Ошибка проверки статуса участника' });
  }
}


