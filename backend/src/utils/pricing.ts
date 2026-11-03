import { prisma } from '../config/db';
import { TariffType } from '@prisma/client';

export interface PriceBracket {
  tier: 'RETAIL' | 'WHOLESALE' | 'LARGE_WHOLESALE';
  label: string;
  from: number;
  to: number | null;
  rate: number;
  count: number;
  subtotal: number;
}

export interface CalculationParams {
  tariffType: TariffType;
  itemsCount: number;
  boxesCount?: number;
  extraServices?: string[];
  ssccNeeded?: boolean;
  includeOfficialCodeFee?: boolean;
}

export interface PricingCalculationResult {
  safeItemsCount: number;
  unitPrice: number;
  baseUnitPrice: number;
  totalPrice: number;
  tanboxServicesTotal: number;
  estDays: number;
  estimatedTimeText: string;
  brackets: PriceBracket[];
  breakdown: {
    baseBatchTotal: number;
    ssccTotal: number;
    ssccPricePerBox: number;
    resolvedBoxesCount: number;
    isSsccIncludedInTariff: boolean;
    layoutTotal: number;
    layoutType: 'NONE' | 'DESIGNER' | 'CLIENT_APPROVAL';
    deliveryTotal: number;
    isUrgent: boolean;
    urgentPercent: number;
    urgentAddition: number;
    officialCodeUnitPrice: number;
    officialCodesTotal: number;
    isOfficialCodeIncluded: boolean;
    tier: 'LARGE_WHOLESALE' | 'WHOLESALE' | 'RETAIL';
  };
  details: {
    unitBasePrice: number;
    unitAdditions: number;
    flatAdditions: number;
    tier: 'LARGE_WHOLESALE' | 'WHOLESALE' | 'RETAIL';
  };
  adminOnly?: {
    costEstimate: number | null;
    hasCostEstimate: boolean;
    grossMarginPercent: number | null;
    isSellingBelowCost: boolean;
    unitMargin: number;
    estimatedMarginTotal: number;
  };
}

export async function computeOrderPricing(params: CalculationParams): Promise<PricingCalculationResult> {
  const {
    tariffType,
    itemsCount,
    boxesCount,
    extraServices = [],
    ssccNeeded = false,
    includeOfficialCodeFee = false,
  } = params;

  // Sanitize itemsCount to positive integer
  const safeItemsCount = Math.max(1, Math.min(10000000, Math.floor(Number(itemsCount) || 1)));

  // 1. Fetch exact tariff & pricing settings from DB (authoritative single source of truth)
  const [dbTariff, dbSettings] = await Promise.all([
    prisma.tariff.findUnique({ where: { code: tariffType } }),
    prisma.pricingSettings.findUnique({ where: { key: 'GLOBAL' } }),
  ]);

  // Volume thresholds configured in admin panel
  const tier1 = dbSettings ? Number(dbSettings.volumeTier1) : 5000;
  const tier2 = dbSettings ? Number(dbSettings.volumeTier2) : 25000;

  // Fallbacks strictly matching current active production rates
  const fallbackPrices: Record<string, { retail: number; wholesale: number; large: number; cost: number }> = {
    DIGITAL: { retail: 8, wholesale: 7, large: 5, cost: 2.68 },
    PRINT: { retail: 18, wholesale: 16, large: 13, cost: 6.0 },
    STANDARD: { retail: 42, wholesale: 39, large: 32, cost: 18.0 },
    PRO: { retail: 72, wholesale: 65, large: 55, cost: 35.0 },
  };

  const t = fallbackPrices[tariffType] || fallbackPrices.STANDARD;
  const priceRetail = dbTariff ? Number(dbTariff.priceRetail) : t.retail;
  const priceWholesale = dbTariff ? Number(dbTariff.priceWholesale) : t.wholesale;
  const priceLargeWholesale = dbTariff ? Number(dbTariff.priceLargeWholesale) : t.large;
  const rawCost = dbTariff?.costEstimate !== null && dbTariff?.costEstimate !== undefined
    ? Number(dbTariff.costEstimate)
    : null;
  const costEstimate = rawCost !== null && !isNaN(rawCost) && rawCost > 0 ? rawCost : null;

  // 2. Progressive bracket calculation (piecewise linear):
  // Bracket 1: Units up to tier1 -> retail rate
  // Bracket 2: Units between tier1 and tier2 -> wholesale rate
  // Bracket 3: Units above tier2 -> large wholesale rate
  const q1 = Math.min(safeItemsCount, tier1);
  const q2 = Math.max(0, Math.min(safeItemsCount - tier1, Math.max(0, tier2 - tier1)));
  const q3 = Math.max(0, safeItemsCount - Math.max(tier1, tier2));

  const subtotal1 = q1 * priceRetail;
  const subtotal2 = q2 * priceWholesale;
  const subtotal3 = q3 * priceLargeWholesale;
  const baseBatchTotal = subtotal1 + subtotal2 + subtotal3;

  const brackets: PriceBracket[] = [
    {
      tier: 'RETAIL',
      label: `До ${tier1.toLocaleString('ru-RU')} шт.`,
      from: 1,
      to: tier1,
      rate: priceRetail,
      count: q1,
      subtotal: subtotal1,
    },
    {
      tier: 'WHOLESALE',
      label: `От ${(tier1 + 1).toLocaleString('ru-RU')} до ${tier2.toLocaleString('ru-RU')} шт.`,
      from: tier1 + 1,
      to: tier2,
      rate: priceWholesale,
      count: q2,
      subtotal: subtotal2,
    },
    {
      tier: 'LARGE_WHOLESALE',
      label: `Свыше ${tier2.toLocaleString('ru-RU')} шт.`,
      from: tier2 + 1,
      to: null,
      rate: priceLargeWholesale,
      count: q3,
      subtotal: subtotal3,
    },
  ];

  const currentTier: 'LARGE_WHOLESALE' | 'WHOLESALE' | 'RETAIL' =
    safeItemsCount > tier2 ? 'LARGE_WHOLESALE' : safeItemsCount > tier1 ? 'WHOLESALE' : 'RETAIL';

  const baseUnitPrice = Number((baseBatchTotal / safeItemsCount).toFixed(2));

  // 3. Extra Services exact calculations
  // SSCC Aggregation: priced per box/carton, NOT per unit of product
  const ssccPricePerBox = dbSettings ? Number(dbSettings.ssccPrice) : 50.0;
  const isSsccRequested = Boolean(ssccNeeded || extraServices.includes('SSCC_AGGREGATION'));
  const isSsccIncludedInTariff = tariffType === 'PRO';

  let resolvedBoxesCount = 0;
  let ssccBatchTotal = 0;

  if (isSsccRequested && !isSsccIncludedInTariff) {
    const passedBoxes = Number(boxesCount);
    if (Number.isFinite(passedBoxes) && passedBoxes > 0) {
      resolvedBoxesCount = Math.floor(passedBoxes);
    } else {
      // Sensible industry estimation: 20 units per carton
      resolvedBoxesCount = Math.max(1, Math.ceil(safeItemsCount / 20));
    }
    ssccBatchTotal = resolvedBoxesCount * ssccPricePerBox;
  }

  // Sticker layouts: prevent double charging
  const stickerLayoutPrice = dbSettings ? Number(dbSettings.stickerLayoutPrice) : 5000.0;
  const selfLayoutPrice = dbSettings ? Number(dbSettings.selfLayoutPrice) : 1000.0;
  let layoutTotal = 0;
  let layoutType: 'NONE' | 'DESIGNER' | 'CLIENT_APPROVAL' = 'NONE';

  if (extraServices.includes('STICKER_LAYOUT_DESIGN')) {
    layoutTotal += stickerLayoutPrice;
    layoutType = 'DESIGNER';
  } else if (extraServices.includes('STICKER_LAYOUT_APPROVAL')) {
    // Only charge for self-layout review if designer layout is NOT selected
    layoutTotal += selfLayoutPrice;
    layoutType = 'CLIENT_APPROVAL';
  }

  // Delivery: flat rate, does not depend on unit count
  const expressDeliveryPrice = dbSettings ? Number(dbSettings.expressDeliveryPrice) : 15000.0;
  let deliveryTotal = 0;
  if (extraServices.includes('EXPRESS_DELIVERY')) {
    deliveryTotal += expressDeliveryPrice;
  }

  // Urgent processing: surcharge applies ONLY to marking production services (base batch + SSCC)
  // Delivery, layout design fees and official code fees MUST NOT be inflated by urgency
  const urgentPercent = dbSettings ? Number(dbSettings.urgentPercent) : 25.0;
  const isUrgent = extraServices.includes('URGENT_PROCESSING');
  const productionSubtotal = baseBatchTotal + ssccBatchTotal;
  const urgentAddition = isUrgent ? Math.round(productionSubtotal * (urgentPercent / 100)) : 0;

  // Official State Regulated Data Matrix code fee in KZ (2.68 ₸ + 12% VAT = 3.00 ₸)
  const officialCodeUnitPrice = 3.0;
  const officialCodesTotal = Math.round(safeItemsCount * officialCodeUnitPrice * 100) / 100;
  const isOfficialCodeIncluded = Boolean(includeOfficialCodeFee);

  // TANBOX services sum
  const tanboxServicesTotal = Math.round(productionSubtotal + layoutTotal + deliveryTotal + urgentAddition);

  // Final total
  const totalPrice = tanboxServicesTotal + (isOfficialCodeIncluded ? Math.round(officialCodesTotal) : 0);
  const effectiveUnitPrice = Number((totalPrice / safeItemsCount).toFixed(2));

  // 3. Estimated execution turnaround (depends on tariff complexity, batch volume, and urgency)
  let estDays = 1;
  let estimatedTimeText = '~1 день';

  if (tariffType === 'DIGITAL') {
    estDays = 1;
    if (isUrgent) {
      estimatedTimeText = 'от 1–2 часов (экспресс)';
    } else if (safeItemsCount <= 10000) {
      estimatedTimeText = '2–4 часа (в день заказа)';
    } else {
      estimatedTimeText = 'в день заказа (~24 ч)';
    }
  } else if (isUrgent) {
    if (safeItemsCount <= 5000) {
      estDays = 1;
      estimatedTimeText = 'экспресс (~24 часа)';
    } else if (safeItemsCount <= 20000) {
      estDays = 2;
      estimatedTimeText = 'экспресс (~1–2 дня)';
    } else {
      estDays = 3;
      estimatedTimeText = 'экспресс (~2–3 дня)';
    }
  } else if (tariffType === 'PRO') {
    if (safeItemsCount <= 2000) {
      estDays = 2;
      estimatedTimeText = '~1–2 дня';
    } else if (safeItemsCount <= 10000) {
      estDays = 3;
      estimatedTimeText = '~2–3 дня';
    } else if (safeItemsCount <= 50000) {
      estDays = 4;
      estimatedTimeText = '~3–4 дня';
    } else {
      estDays = 6;
      estimatedTimeText = '~5–7 дней';
    }
  } else {
    // PRINT and STANDARD
    if (safeItemsCount <= 2000) {
      estDays = 1;
      estimatedTimeText = '~1 день';
    } else if (safeItemsCount <= 10000) {
      estDays = 2;
      estimatedTimeText = '~1–2 дня';
    } else if (safeItemsCount <= 50000) {
      estDays = 3;
      estimatedTimeText = '~2–3 дня';
    } else {
      estDays = 5;
      estimatedTimeText = '~3–5 дней';
    }
  }

  // 4. Admin metrics: gross margin formula (Revenue - Cost) / Revenue * 100%
  const hasCostEstimate = costEstimate !== null && costEstimate > 0;
  let grossMarginPercent: number | null = null;
  let isSellingBelowCost = false;
  let unitMargin = 0;
  let estimatedMarginTotal = 0;

  if (hasCostEstimate && costEstimate !== null) {
    const totalCostOfBatch = costEstimate * safeItemsCount;
    const productionRevenue = productionSubtotal + urgentAddition;
    if (productionRevenue > 0) {
      grossMarginPercent = Number((((productionRevenue - totalCostOfBatch) / productionRevenue) * 100).toFixed(1));
    }
    unitMargin = Math.max(0, baseUnitPrice - costEstimate);
    estimatedMarginTotal = Math.round(unitMargin * safeItemsCount);
    if (baseUnitPrice < costEstimate) {
      isSellingBelowCost = true;
    }
  }

  return {
    safeItemsCount,
    unitPrice: effectiveUnitPrice,
    baseUnitPrice,
    totalPrice,
    tanboxServicesTotal,
    estDays,
    estimatedTimeText,
    brackets,
    breakdown: {
      baseBatchTotal,
      ssccTotal: ssccBatchTotal,
      ssccPricePerBox,
      resolvedBoxesCount,
      isSsccIncludedInTariff,
      layoutTotal,
      layoutType,
      deliveryTotal,
      isUrgent,
      urgentPercent,
      urgentAddition,
      officialCodeUnitPrice,
      officialCodesTotal,
      isOfficialCodeIncluded,
      tier: currentTier,
    },
    details: {
      unitBasePrice: baseUnitPrice,
      unitAdditions: resolvedBoxesCount > 0 ? Number((ssccBatchTotal / safeItemsCount).toFixed(2)) : 0,
      flatAdditions: layoutTotal + deliveryTotal,
      tier: currentTier,
    },
    adminOnly: {
      costEstimate,
      hasCostEstimate,
      grossMarginPercent,
      isSellingBelowCost,
      unitMargin,
      estimatedMarginTotal,
    },
  };
}
