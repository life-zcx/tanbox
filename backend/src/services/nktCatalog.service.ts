import { prisma } from '../config/db';
import { MarkirovkaClient } from './markirovkaClient.service';
import { OrderCategory } from '@prisma/client';
import { logger } from '../utils/logger';
import { getNktSettings } from './nktSettings.service';

export interface NormalizedNktProduct {
  gtin: string;
  name: string;
  brand?: string;
  article?: string;
  size?: string;
  color?: string;
  tnved?: string;
  country?: string;
  producer?: string;
  composition?: string;
  raw?: any;
}

/**
 * Normalizes raw response from Kazakhstan National Catalog (НКТ nationalcatalog.kz & ИС МПТ)
 */
export function normalizeNktProduct(raw: any, gtin: string): NormalizedNktProduct {
  const cleanGtin = gtin.replace(/\D/g, '');
  if (!raw || typeof raw !== 'object') {
    return {
      gtin: cleanGtin,
      name: `Товар GTIN ${cleanGtin}`,
    };
  }

  // Extract from nested attributes list if present
  const attrMap: Record<string, string> = {};
  if (Array.isArray(raw.attributes)) {
    for (const a of raw.attributes) {
      const codeKey = String(a.code || '').toLowerCase().trim();
      const nameKey = String(a.nameRu || a.nameKk || a.name || '').toLowerCase().trim();
      const val = typeof a.value === 'object' && a.value !== null
        ? String(a.value.nameRu || a.value.nameKk || a.value.name || a.value.code || '')
        : String(a.value || a.values?.nameRu || a.values?.nameKk || '');

      if (codeKey && val) attrMap[codeKey] = val.trim();
      if (nameKey && val) attrMap[nameKey] = val.trim();
    }
  }

  const findVal = (keys: string[]): string | undefined => {
    for (const k of keys) {
      if (raw[k] && typeof raw[k] === 'string' && raw[k].trim()) {
        return raw[k].trim();
      }
      const lower = k.toLowerCase();
      if (attrMap[lower]) return attrMap[lower];
      for (const [attrK, attrV] of Object.entries(attrMap)) {
        if (attrK.includes(lower) && attrV) return attrV;
      }
    }
    return undefined;
  };

  const name =
    raw.nameRu ||
    raw.shortNameRu ||
    raw.nameKk ||
    findVal(['name_ru', 'good_name', 'name', 'product_name', 'productName', 'title', 'наименование']) ||
    `Товар (${cleanGtin})`;

  const brand =
    findVal(['brand', 'trademark', 'brand_name', 'brandName', 'торговая марка', 'бренд']) ||
    undefined;

  const article =
    findVal(['good_vendor_code', 'vendor_code', 'article', 'vendorCode', 'model', 'артикул', 'код товара']) ||
    undefined;

  const size =
    findVal(['size', 'good_size', 'size_ru', 'размер', 'объем', 'объём', 'масса']) ||
    undefined;

  const color =
    findVal(['color', 'good_color', 'цвет', 'оттенок']) ||
    undefined;

  const tnved =
    findVal(['tnved', 'tnved_code', 'tnvedCode', 'тнвэд', 'код тн вэд', 'тн вэд']) ||
    undefined;

  const country =
    (typeof raw.country === 'object' ? raw.country?.values?.nameRu || raw.country?.nameRu : undefined) ||
    findVal(['country', 'producer_country', 'country_of_origin', 'страна происхождения', 'страна']) ||
    undefined;

  const producer =
    findVal(['producer_name', 'producer_identifier', 'manufacturer', 'producer', 'изготовитель', 'производитель']) ||
    undefined;

  const composition =
    findVal(['composition', 'material', 'состав', 'материал']) ||
    undefined;

  return {
    gtin: cleanGtin.padStart(14, '0'),
    name,
    brand,
    article,
    size,
    color,
    tnved,
    country,
    producer,
    composition,
    raw,
  };
}

/**
 * Look up product in Kazakhstan National Catalog using official nationalcatalog.kz Open API
 */
async function queryNationalCatalogApi(tin: string): Promise<any | null> {
  const settings = getNktSettings();
  if (!settings.enabled) {
    logger.info(`[NKT Open API] Поиск по НКТ отключен в настройках админки (GTIN: ${tin})`);
    return null;
  }

  const clean = tin.replace(/\D/g, '');
  if (!clean || clean.length < 8) return null;

  // Try exact input, 13-digit (slice(1) if 14-digit started with 0), 14-digit (padded), and unpadded
  const candidates: string[] = [clean];
  if (clean.length === 14 && clean.startsWith('0')) {
    candidates.push(clean.slice(1));
  }
  if (clean.length === 13) {
    candidates.push('0' + clean);
  }
  const unpadded = clean.replace(/^0+/, '');
  if (unpadded && !candidates.includes(unpadded)) {
    candidates.push(unpadded);
  }

  for (const candidate of candidates) {
    try {
      const url = `${settings.baseUrl}/portal/api/v1/products/${encodeURIComponent(candidate)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-KEY': settings.apiKey,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && (data.nameRu || data.nameKk || data.gtin || data.ntin || data.id)) {
          return data;
        }
      }
    } catch (e: any) {
      logger.warn(`[NKT Open API] Request error for ${candidate}: ${e.message}`);
    }
  }

  return null;
}

/**
 * Look up a product by GTIN in Kazakhstan National Catalog (НКТ)
 * Uses official Open API key (nationalcatalog.kz) with fallback to markirovka.kz
 */
export async function resolveNktProduct(
  gtin: string,
  category?: string | OrderCategory,
  userId?: string
): Promise<NormalizedNktProduct | null> {
  const cleanGtin = (gtin || '').replace(/\D/g, '');
  if (!cleanGtin || cleanGtin.length < 8) {
    throw new Error('Указан некорректный GTIN');
  }

  // 1. Query official Kazakhstan National Catalog (nationalcatalog.kz) via Open API Key
  const nktData = await queryNationalCatalogApi(cleanGtin);
  if (nktData) {
    return normalizeNktProduct(nktData, cleanGtin);
  }

  // 2. Fallback to markirovka.kz (ИС МПТ / True API) if user has active account connected
  let account = null;
  if (userId) {
    account = await prisma.markirovkaAccount.findFirst({
      where: { userId, status: 'ACTIVE' },
    });
  }
  if (!account) {
    account = await prisma.markirovkaAccount.findFirst({
      where: { status: 'ACTIVE' },
    });
  }

  if (account) {
    try {
      const client = new MarkirovkaClient(account);
      const productGroup = category ? String(category).toLowerCase() : undefined;
      const res = await client.searchProductByGtin(cleanGtin.padStart(14, '0'), productGroup);
      if (res && res.success && res.product) {
        return normalizeNktProduct(res.product, cleanGtin);
      }
    } catch (e: any) {
      logger.warn(`[Markirovka.kz Lookup] Failed for GTIN ${cleanGtin}: ${e?.message}`);
    }
  }

  return null;
}

/**
 * Synchronizes and enriches all OrderPosition records of an order from NKT (Национальный Каталог Товаров)
 */
export async function syncOrderPositionsFromNkt(orderId: string, force: boolean = false): Promise<any> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      positions: { orderBy: { index: 'asc' } },
      user: true,
    },
  });

  if (!order) {
    throw new Error(`Заказ ${orderId} не найден`);
  }

  // If order has no positions yet, try to discover GTINs from codes or markirovka orders
  if (order.positions.length === 0) {
    const codeItem = await prisma.orderCodeItem.findFirst({
      where: { orderId: order.id, gtin: { not: null } },
      select: { gtin: true },
    });
    if (codeItem && codeItem.gtin) {
      await prisma.orderPosition.create({
        data: {
          orderId: order.id,
          index: 1,
          name: `Товар (${codeItem.gtin})`,
          gtin: codeItem.gtin,
          quantity: order.itemsCount || 1,
        },
      });
    }
  }

  const positions = await prisma.orderPosition.findMany({
    where: { orderId: order.id },
    orderBy: { index: 'asc' },
  });

  const updatedPositions = [];
  let updatedCount = 0;
  const notFoundGtins: string[] = [];

  for (const pos of positions) {
    const targetGtin = pos.gtin ? pos.gtin.trim() : null;
    if (!targetGtin) {
      updatedPositions.push(pos);
      continue;
    }

    const custom = (pos.customData as any) || {};
    const alreadyEnriched = Boolean(
      custom.syncedFromNktAt ||
      (pos.name &&
        !pos.name.startsWith('markirovka_emission_') &&
        !pos.name.startsWith('Товар (') &&
        (pos.article || pos.size || pos.color || custom.brand))
    );

    if (!force && alreadyEnriched) {
      updatedPositions.push(pos);
      continue;
    }

    try {
      const nktData = await resolveNktProduct(targetGtin, order.category, order.userId);
      if (nktData) {
        const custom = {
          ...((pos.customData as any) || {}),
          brand: nktData.brand || undefined,
          country: nktData.country || undefined,
          producer: nktData.producer || undefined,
          tnved: nktData.tnved || undefined,
          composition: nktData.composition || undefined,
          syncedFromNktAt: new Date().toISOString(),
        };

        const updated = await prisma.orderPosition.update({
          where: { id: pos.id },
          data: {
            name: nktData.name || pos.name,
            article: nktData.article || pos.article,
            size: nktData.size || pos.size,
            color: nktData.color || pos.color,
            customData: custom,
          },
        });

        updatedPositions.push(updated);
        updatedCount++;
      } else {
        notFoundGtins.push(targetGtin);
        updatedPositions.push(pos);
      }
    } catch (err: any) {
      logger.warn(`[Sync NKT] Failed for position ${pos.id} (GTIN ${targetGtin}): ${err.message}`);
      notFoundGtins.push(targetGtin);
      updatedPositions.push(pos);
    }
  }

  const updatedOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      positions: { orderBy: { index: 'asc' } },
      user: {
        select: {
          id: true,
          companyName: true,
          binIin: true,
          email: true,
          phone: true,
        },
      },
      codeItems: {
        take: 5,
        orderBy: { index: 'asc' },
      },
      _count: {
        select: { codeItems: true },
      },
    },
  });

  return {
    order: updatedOrder,
    updatedCount,
    notFoundGtins,
  };
}
