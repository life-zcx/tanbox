import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/db';
import { OrderCategory, MarkirovkaCardStatus } from '@prisma/client';
import { MarkirovkaClient } from '../services/markirovkaClient.service';
import { logger } from '../utils/logger';

/**
 * Detect OrderCategory from IS MPT product group or TNVED
 */
function mapMptGroupToCategory(groupCodeOrName?: string, tnved?: string, fallbackCategory?: OrderCategory): OrderCategory {
  const str = String(groupCodeOrName || '').toLowerCase();
  const code = String(tnved || '').replace(/\D/g, '');

  if (str.includes('shoe') || str.includes('обув') || code.startsWith('64')) {
    return OrderCategory.SHOES;
  }
  if (
    str.includes('cloth') ||
    str.includes('textil') ||
    str.includes('легпром') ||
    str.includes('одежд') ||
    code.startsWith('61') ||
    code.startsWith('62') ||
    code.startsWith('63')
  ) {
    return OrderCategory.TEXTILE;
  }
  if (str.includes('pharma') || str.includes('med') || str.includes('лекарств') || str.includes('фарм') || code.startsWith('30')) {
    return OrderCategory.MEDICINE;
  }
  if (str.includes('water') || str.includes('вод') || str.includes('напит') || code.startsWith('2201') || code.startsWith('2202')) {
    return OrderCategory.WATER;
  }
  if (
    str.includes('oil') ||
    str.includes('масл') ||
    str.includes('fluid') ||
    str.includes('смазоч') ||
    str.includes('жидкост') ||
    code.startsWith('2710') ||
    code.startsWith('3403')
  ) {
    return OrderCategory.OILS;
  }
  if (str.includes('tobacco') || str.includes('табак') || str.includes('сигарет') || code.startsWith('24')) {
    return OrderCategory.TOBACCO;
  }
  if (str.includes('beer') || str.includes('пив') || code.startsWith('2203')) {
    return OrderCategory.BEER;
  }
  if (str.includes('suppl') || str.includes('бад')) {
    return OrderCategory.DIETARY_SUPPLEMENTS;
  }

  return fallbackCategory || OrderCategory.OILS;
}

/**
 * GET /api/markirovka/catalog
 * Lists ONLY product cards imported directly from user's IS MPT (markirovka.kz) account
 */
export async function getMptCatalogHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 24));
    const skip = (page - 1) * limit;

    // Strictly filter ONLY IS MPT cards (not NKT cards)
    const where: any = {
      userId: req.user.id,
      mptCardId: { startsWith: 'IS_MPT' },
      gtin: { not: null },
    };

    if (req.query.category && Object.values(OrderCategory).includes(req.query.category as any)) {
      where.category = req.query.category;
    }

    if (req.query.accountId) {
      where.accountId = req.query.accountId;
    }

    if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
      const q = req.query.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { article: { contains: q, mode: 'insensitive' } },
        { gtin: { contains: q } },
        { tnved: { contains: q } },
      ];
    }

    const [total, cards, categoriesStats] = await Promise.all([
      prisma.markirovkaProductCard.count({ where }),
      prisma.markirovkaProductCard.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          account: {
            select: { id: true, name: true, login: true, status: true },
          },
        },
      }),
      prisma.markirovkaProductCard.groupBy({
        by: ['category'],
        where: {
          userId: req.user.id,
          mptCardId: { startsWith: 'IS_MPT' },
          gtin: { not: null },
        },
        _count: { category: true },
      }),
    ]);

    const latestCard = await prisma.markirovkaProductCard.findFirst({
      where: {
        userId: req.user.id,
        mptCardId: { startsWith: 'IS_MPT' },
      },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    return res.json({
      success: true,
      cards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      categoriesStats: categoriesStats.reduce((acc: any, curr) => {
        acc[curr.category] = curr._count.category;
        return acc;
      }, {}),
      lastSyncedAt: latestCard?.updatedAt || null,
    });
  } catch (err: any) {
    logger.error('getMptCatalogHandler error:', err);
    return res.status(500).json({ message: err.message || 'Ошибка загрузки карточек ИС МПТ' });
  }
}

function extractAttrValue(attrs: any[], code: string): any {
  if (!Array.isArray(attrs)) return null;
  const item = attrs.find((a: any) => a.attribute?.code === code);
  if (!item) return null;
  const val = item.value;
  if (val && typeof val === 'object' && (val.ru || val.kz || val.en)) {
    return val.ru || val.kz || val.en;
  }
  return typeof val === 'string' || typeof val === 'number' ? val : null;
}

/**
 * POST /api/markirovka/catalog/sync
 * Pulls and synchronizes product cards DIRECTLY from participant's IS MPT account (markirovka.kz)
 * Uses native /api/v1/product-registry/product endpoint (Published and Draft descriptions)
 */
export async function syncMptCatalogHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const userId = req.user.id;
    const { accountId } = req.body || {};

    // 0. Clean up any phantom or unverified cards from previous failed orders
    await prisma.markirovkaProductCard.deleteMany({
      where: {
        userId,
        OR: [
          { mptCardId: 'IS_MPT_05407008073879' },
          { gtin: '05407008073879' },
          { name: { startsWith: 'Товар (05407008073879)' } },
        ],
      },
    });

    // 1. Find user account(s) for IS MPT
    const accounts = await prisma.markirovkaAccount.findMany({
      where: accountId ? { id: accountId, userId } : { userId },
    });

    if (accounts.length === 0) {
      return res.status(400).json({
        message: 'Для синхронизации карточек сначала подключите станцию ИС МПТ в разделе «ИС МПТ» (логин и пароль markirovka.kz)',
      });
    }

    const primaryAccount = accounts.find((a) => a.status === 'ACTIVE') || accounts[0];
    const client = new MarkirovkaClient(primaryAccount);

    logger.info(`[IS MPT Sync] Fetching owned products directly from markirovka.kz for account ${primaryAccount.name || primaryAccount.login}`);

    // 2. Query IS MPT native Product Registry (/api/v1/product-registry/product?accessType=OWNED)
    let allOwnedProducts: any[] = [];
    try {
      const pageSize = 100;
      let offset = 0;
      // Support large catalogs up to 10,000 items with pagination
      while (offset < 10000) {
        const batch = await client.getOwnedProductRegistryProducts({ limit: pageSize, offset });
        if (!Array.isArray(batch) || batch.length === 0) break;
        allOwnedProducts.push(...batch);
        if (batch.length < pageSize) break;
        offset += pageSize;
      }
    } catch (apiErr: any) {
      logger.warn(`[IS MPT Sync] Error querying product registry: ${apiErr.message}`);
    }

    if (allOwnedProducts.length === 0) {
      return res.json({
        success: true,
        syncedCount: 0,
        total: 0,
        message: 'На вашем аккаунте в ИС МПТ (markirovka.kz) пока не найдено описаний товаров в разделе «Описания товаров».',
      });
    }

    logger.info(`[IS MPT Sync] Found ${allOwnedProducts.length} raw products in IS MPT product registry`);

    // 3. Deduplicate by GTIN: if duplicate exists, prioritize PUBLISHED over DRAFT
    const gtinMap = new Map<string, any>();
    for (const item of allOwnedProducts) {
      const rawGtin = item.gtin ? String(item.gtin).trim().replace(/\D/g, '') : null;
      if (!rawGtin || rawGtin.length < 8) continue;
      const gtin14 = rawGtin.padStart(14, '0');

      const existing = gtinMap.get(gtin14);
      if (!existing) {
        gtinMap.set(gtin14, item);
      } else if (existing.status !== 'PUBLISHED' && item.status === 'PUBLISHED') {
        gtinMap.set(gtin14, item);
      }
    }

    // Purge any stale, phantom or mock IS_MPT cards that are not present in markirovka.kz
    const activeGtins = Array.from(gtinMap.keys());
    await prisma.markirovkaProductCard.deleteMany({
      where: {
        userId,
        mptCardId: { startsWith: 'IS_MPT' },
        gtin: { notIn: activeGtins },
      },
    });

    let syncedCount = 0;
    const detectedCategories = new Set<OrderCategory>();

    // 4. Process products in parallel batches (chunk of 10) to support hundreds/thousands of cards fast
    const itemsList = Array.from(gtinMap.entries());
    const CHUNK_SIZE = 10;

    for (let i = 0; i < itemsList.length; i += CHUNK_SIZE) {
      const chunk = itemsList.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async ([gtin14, item]) => {
          try {
            const nameRu =
              (typeof item.productName === 'object' ? item.productName?.ru || item.productName?.kz : item.productName) ||
              (typeof item.nameRu === 'object' ? item.nameRu?.ru || item.nameRu?.kz : item.nameRu) ||
              item.name;

            if (!nameRu) return;

            const nameKk =
              (typeof item.productName === 'object' ? item.productName?.kz : null) ||
              (typeof item.nameRu === 'object' ? item.nameRu?.kz : null) ||
              null;

            const tnved = item.tnved ? String(item.tnved).trim() : null;
            const pg = item.pg?.value || item.pg?.name?.ru || item.productGroup?.code || item.productGroup || '';

            const category = mapMptGroupToCategory(pg, tnved || undefined, OrderCategory.OILS);
            detectedCategories.add(category);

            // Fetch deep details (brand, producer, country, model, shelf life)
            let brand: string | null = null;
            let model: string | null = null;
            let producerName: string | null = null;
            let producerAddress: string | null = null;
            let country: string = 'Казахстан';
            let composition: string | null = null;
            let shelfLife: string | null = null;
            let article: string | null = null;

            try {
              const details = await client.getProductRegistryProductDetails(item.id);
              if (details) {
                const allAttrs = [
                  ...(details.mandatoryAttributes || []),
                  ...(details.systemAttributes || []),
                  ...(details.optionalAttributes || []),
                ];
                brand = extractAttrValue(allAttrs, 'brand') || extractAttrValue(allAttrs, '15837_model') || null;
                model = extractAttrValue(allAttrs, '15837_model') || null;
                producerName = extractAttrValue(allAttrs, 'manufacturer_name') || null;
                producerAddress = extractAttrValue(allAttrs, 'manufacturer_address') || null;
                country = extractAttrValue(allAttrs, 'manufacturer_country') || extractAttrValue(allAttrs, 'trademark_country') || 'Казахстан';
                composition = extractAttrValue(allAttrs, '2483_product_composition') || null;
                shelfLife = extractAttrValue(allAttrs, 'expiration_date') ? String(extractAttrValue(allAttrs, 'expiration_date')) : null;
                article = extractAttrValue(allAttrs, 'article') || extractAttrValue(allAttrs, 'vendor_code') || null;
              }
            } catch (detailErr: any) {
              logger.warn(`[IS MPT Sync] Could not fetch details for item ${item.id}: ${detailErr.message}`);
            }

            const packageType = item.packageType?.value || item.packageType?.name?.ru || 'UNIT';

            let cardStatus: MarkirovkaCardStatus = MarkirovkaCardStatus.APPROVED;
            if (item.status === 'DRAFT') {
              cardStatus = MarkirovkaCardStatus.DRAFT;
            } else if (item.status === 'PENDING_MODERATION' || item.status === 'MODERATION') {
              cardStatus = MarkirovkaCardStatus.PENDING_MODERATION;
            } else if (item.status === 'REJECTED') {
              cardStatus = MarkirovkaCardStatus.REJECTED;
            }

            const existingCard = await prisma.markirovkaProductCard.findFirst({
              where: {
                userId,
                OR: [
                  { mptCardId: `IS_MPT_${gtin14}` },
                  { gtin: gtin14 },
                ],
              },
            });

            if (existingCard) {
              await prisma.markirovkaProductCard.update({
                where: { id: existingCard.id },
                data: {
                  mptCardId: `IS_MPT_${gtin14}`,
                  name: nameRu,
                  nameKk: nameKk || existingCard.nameKk,
                  brand: brand || existingCard.brand,
                  model: model || existingCard.model,
                  article: article || existingCard.article,
                  tnved: tnved || existingCard.tnved,
                  country: country || existingCard.country,
                  producerName: producerName || existingCard.producerName,
                  producerAddress: producerAddress || existingCard.producerAddress,
                  composition: composition || existingCard.composition,
                  shelfLife: shelfLife || existingCard.shelfLife,
                  packageType: packageType || existingCard.packageType,
                  category,
                  status: cardStatus,
                  attributes: { source: 'IS_MPT_REGISTRY', raw: item },
                  updatedAt: new Date(),
                },
              });
              syncedCount++;
            } else {
              await prisma.markirovkaProductCard.create({
                data: {
                  userId,
                  accountId: primaryAccount.id,
                  mptCardId: `IS_MPT_${gtin14}`,
                  category,
                  name: nameRu,
                  nameKk,
                  brand,
                  model,
                  article,
                  tnved,
                  country,
                  producerName,
                  producerAddress,
                  composition,
                  shelfLife,
                  packageType,
                  gtin: gtin14,
                  status: cardStatus,
                  attributes: { source: 'IS_MPT_REGISTRY', raw: item },
                },
              });
              syncedCount++;
            }
          } catch (err: any) {
            logger.warn(`[IS MPT Sync] Error processing GTIN ${gtin14}: ${err.message}`);
          }
        })
      );
    }

    // 5. Auto-sync primaryAccount categories with what was found
    if (detectedCategories.size > 0) {
      try {
        const mergedCategories = Array.from(
          new Set([...(primaryAccount.categories || []), ...Array.from(detectedCategories)])
        );
        await prisma.markirovkaAccount.update({
          where: { id: primaryAccount.id },
          data: {
            categories: mergedCategories,
            lastCheckedAt: new Date(),
          },
        });
      } catch (catErr: any) {
        logger.warn(`[IS MPT Sync] Could not update account categories: ${catErr.message}`);
      }
    }

    return res.json({
      success: true,
      syncedCount,
      total: gtinMap.size,
      message: `Успешно загружено ${syncedCount} карточек товаров напрямую из ИС МПТ (markirovka.kz)`,
    });
  } catch (err: any) {
    logger.error('syncMptCatalogHandler error:', err);
    return res.status(500).json({ message: err.message || 'Ошибка синхронизации с сервером ИС МПТ' });
  }
}
