import { prisma } from '../config/db';
import { TariffType } from '@prisma/client';

export interface CalculationParams {
  tariffType: TariffType;
  itemsCount: number;
  extraServices?: string[];
  ssccNeeded?: boolean;
}

export interface PricingCalculationResult {
  safeItemsCount: number;
  unitPrice: number;
  totalPrice: number;
  estDays: number;
  details: {
    unitBasePrice: number;
    unitAdditions: number;
    flatAdditions: number;
    tier: 'LARGE_WHOLESALE' | 'WHOLESALE' | 'RETAIL';
  };
  // Admin-only metrics
  adminOnly?: {
    costEstimate: number;
    unitMargin: number;
    estimatedMarginTotal: number;
  };
}

export async function computeOrderPricing(params: CalculationParams): Promise<PricingCalculationResult> {
  const { tariffType, itemsCount, extraServices = [], ssccNeeded = false } = params;

  // Sanitize itemsCount
  const safeItemsCount = Math.max(1, Math.min(10000000, Math.floor(Number(itemsCount) || 1)));

  // 1. Fetch exact tariff & pricing settings from DB
  const [dbTariff, dbSettings] = await Promise.all([
    prisma.tariff.findUnique({ where: { code: tariffType } }),
    prisma.pricingSettings.findUnique({ where: { key: 'GLOBAL' } }),
  ]);

  // Volume thresholds
  const tier1 = dbSettings?.volumeTier1 ?? 20000;
  const tier2 = dbSettings?.volumeTier2 ?? 100000;

  // Default fallbacks if DB record not yet populated
  const fallbackPrices: Record<string, { retail: number; wholesale: number; large: number; cost: number }> = {
    DIGITAL: { retail: 15, wholesale: 12, large: 10, cost: 2.68 },
    PRINT: { retail: 35, wholesale: 30, large: 25, cost: 6.0 },
    STANDARD: { retail: 65, wholesale: 55, large: 50, cost: 18.0 },
    PRO: { retail: 120, wholesale: 105, large: 90, cost: 35.0 },
  };

  const t = fallbackPrices[tariffType] || fallbackPrices.STANDARD;
  const priceRetail = dbTariff?.priceRetail ?? t.retail;
  const priceWholesale = dbTariff?.priceWholesale ?? t.wholesale;
  const priceLargeWholesale = dbTariff?.priceLargeWholesale ?? t.large;
  const costEstimate = dbTariff?.costEstimate ?? t.cost;

  // Determine unit base price according to batch size
  let unitBasePrice = priceRetail;
  let tier: 'LARGE_WHOLESALE' | 'WHOLESALE' | 'RETAIL' = 'RETAIL';
  if (safeItemsCount > tier2) {
    unitBasePrice = priceLargeWholesale;
    tier = 'LARGE_WHOLESALE';
  } else if (safeItemsCount > tier1) {
    unitBasePrice = priceWholesale;
    tier = 'WHOLESALE';
  }

  // Extra services exact additions
  const ssccPricePerItem = dbSettings?.ssccPrice ?? 5.0;
  const stickerLayoutPrice = dbSettings?.stickerLayoutPrice ?? 5000.0;
  const urgentPercent = dbSettings?.urgentPercent ?? 20.0;
  const expressDeliveryPrice = dbSettings?.expressDeliveryPrice ?? 15000.0;

  let flatAdditions = 0;
  let unitAdditions = 0;

  if (ssccNeeded || extraServices.includes('SSCC_AGGREGATION') || tariffType === 'PRO') {
    if (tariffType !== 'PRO') {
      unitAdditions += ssccPricePerItem;
    }
  }

  if (extraServices.includes('STICKER_LAYOUT_DESIGN')) {
    flatAdditions += stickerLayoutPrice;
  }

  if (extraServices.includes('EXPRESS_DELIVERY')) {
    flatAdditions += expressDeliveryPrice;
  }

  const finalUnitPrice = Math.round(unitBasePrice + unitAdditions);
  let totalPrice = finalUnitPrice * safeItemsCount + flatAdditions;

  if (extraServices.includes('URGENT_PROCESSING')) {
    totalPrice *= 1 + urgentPercent / 100;
  }

  totalPrice = Math.round(totalPrice);

  // Estimated execution time
  let estDays = 1;
  if (safeItemsCount > 50000) estDays = 5;
  else if (safeItemsCount > 10000) estDays = 3;
  else if (safeItemsCount > 2000) estDays = 2;

  const unitMargin = Math.max(0, unitBasePrice - costEstimate);
  const estimatedMarginTotal = Math.round(unitMargin * safeItemsCount);

  return {
    safeItemsCount,
    unitPrice: finalUnitPrice,
    totalPrice,
    estDays,
    details: {
      unitBasePrice,
      unitAdditions,
      flatAdditions,
      tier,
    },
    adminOnly: {
      costEstimate,
      unitMargin,
      estimatedMarginTotal,
    },
  };
}
