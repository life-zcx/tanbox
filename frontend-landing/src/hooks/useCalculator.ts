import { useState, useEffect } from 'react';
import { TariffCode, CalculationResult, TariffItem, PricingSettings, PriceBracket } from '../types';
import { apiClient } from '../api/client';

export const computeInstantPrice = (
  tariffType: TariffCode,
  itemsCount: number,
  extraServices: string[],
  ssccNeeded: boolean,
  boxesCount?: number,
  includeOfficialCodes?: boolean,
  dbTariffs?: TariffItem[],
  dbSettings?: PricingSettings | null
): CalculationResult => {
  const found = dbTariffs?.find((t) => t.code === tariffType);
  const tier1 = dbSettings ? Number(dbSettings.volumeTier1) : 5000;
  const tier2 = dbSettings ? Number(dbSettings.volumeTier2) : 25000;

  // Active production tariff rates
  const fallbackPrices: Record<string, { retail: number; wholesale: number; large: number }> = {
    DIGITAL: { retail: 8, wholesale: 7, large: 5 },
    PRINT: { retail: 18, wholesale: 16, large: 13 },
    STANDARD: { retail: 42, wholesale: 39, large: 32 },
    PRO: { retail: 72, wholesale: 65, large: 55 },
  };

  const f = fallbackPrices[tariffType] || fallbackPrices.STANDARD;
  const priceRetail = found?.priceRetail ?? f.retail;
  const priceWholesale = found?.priceWholesale ?? f.wholesale;
  const priceLargeWholesale = found?.priceLargeWholesale ?? f.large;

  const safeCount = Math.max(0, Math.floor(Number(itemsCount) || 0));

  if (safeCount <= 0) {
    const emptyBrackets: PriceBracket[] = [
      {
        tier: 'RETAIL',
        label: `До ${tier1.toLocaleString('ru-RU')} шт.`,
        from: 1,
        to: tier1,
        rate: priceRetail,
        count: 0,
        subtotal: 0,
      },
      {
        tier: 'WHOLESALE',
        label: `От ${(tier1 + 1).toLocaleString('ru-RU')} до ${tier2.toLocaleString('ru-RU')} шт.`,
        from: tier1 + 1,
        to: tier2,
        rate: priceWholesale,
        count: 0,
        subtotal: 0,
      },
      {
        tier: 'LARGE_WHOLESALE',
        label: `Свыше ${tier2.toLocaleString('ru-RU')} шт.`,
        from: tier2 + 1,
        to: null,
        rate: priceLargeWholesale,
        count: 0,
        subtotal: 0,
      },
    ];

    return {
      tariffType,
      itemsCount: 0,
      unitPrice: priceRetail,
      baseUnitPrice: priceRetail,
      totalPrice: 0,
      tanboxServicesTotal: 0,
      estimatedMarginTotal: 0,
      consumableCostPerItem: 0,
      estimatedDays: 1,
      brackets: emptyBrackets,
      breakdown: {
        baseUnitPrice: priceRetail,
        baseBatchTotal: 0,
        unitAdditions: 0,
        flatAdditions: 0,
        ssccTotal: 0,
        ssccPricePerBox: dbSettings?.ssccPrice ?? 50,
        resolvedBoxesCount: 0,
        isSsccIncludedInTariff: tariffType === 'PRO',
        layoutTotal: 0,
        layoutType: 'NONE',
        deliveryTotal: 0,
        isUrgent: false,
        urgentPercent: dbSettings?.urgentPercent ?? 25,
        urgentAddition: 0,
        officialCodeUnitPrice: 3.0,
        officialCodesTotal: 0,
        isOfficialCodeIncluded: Boolean(includeOfficialCodes),
        tier: 'RETAIL',
      },
    };
  }

  // Progressive bracket calculation
  const q1 = Math.min(safeCount, tier1);
  const q2 = Math.max(0, Math.min(safeCount - tier1, Math.max(0, tier2 - tier1)));
  const q3 = Math.max(0, safeCount - Math.max(tier1, tier2));

  const subtotal1 = q1 * priceRetail;
  const subtotal2 = q2 * priceWholesale;
  const subtotal3 = q3 * priceLargeWholesale;
  const baseBatchTotal = subtotal1 + subtotal2 + subtotal3;
  const baseUnitPrice = Number((baseBatchTotal / safeCount).toFixed(2));

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
    safeCount > tier2 ? 'LARGE_WHOLESALE' : safeCount > tier1 ? 'WHOLESALE' : 'RETAIL';

  // SSCC Aggregation (per box, not per unit of product; included in PRO)
  const ssccPricePerBox = dbSettings?.ssccPrice ?? 50;
  const isSsccRequested = Boolean(ssccNeeded || extraServices.includes('SSCC_AGGREGATION'));
  const isSsccIncluded = tariffType === 'PRO';

  let resolvedBoxesCount = 0;
  let ssccBatchTotal = 0;
  if (isSsccRequested && !isSsccIncluded) {
    resolvedBoxesCount = boxesCount && boxesCount > 0 ? Math.floor(boxesCount) : Math.max(1, Math.ceil(safeCount / 20));
    ssccBatchTotal = resolvedBoxesCount * ssccPricePerBox;
  }

  // Layouts: prevent double charging
  const stickerLayoutPrice = dbSettings?.stickerLayoutPrice ?? 5000;
  const selfLayoutPrice = dbSettings?.selfLayoutPrice ?? 1000;
  let layoutTotal = 0;
  let layoutType: 'NONE' | 'DESIGNER' | 'CLIENT_APPROVAL' = 'NONE';

  if (extraServices.includes('STICKER_LAYOUT_DESIGN')) {
    layoutTotal += stickerLayoutPrice;
    layoutType = 'DESIGNER';
  } else if (extraServices.includes('STICKER_LAYOUT_APPROVAL')) {
    layoutTotal += selfLayoutPrice;
    layoutType = 'CLIENT_APPROVAL';
  }

  // Delivery
  const expressDeliveryPrice = dbSettings?.expressDeliveryPrice ?? 15000;
  const deliveryTotal = extraServices.includes('EXPRESS_DELIVERY') ? expressDeliveryPrice : 0;

  // Urgent surcharge on marking production services only
  const urgentPercent = dbSettings?.urgentPercent ?? 25;
  const isUrgent = extraServices.includes('URGENT_PROCESSING');
  const productionSubtotal = baseBatchTotal + ssccBatchTotal;
  const urgentAddition = isUrgent ? Math.round(productionSubtotal * (urgentPercent / 100)) : 0;

  // Official state regulated Data Matrix code fee (2.68 ₸ + 12% VAT = 3.00 ₸)
  const officialCodeUnitPrice = 3.0;
  const officialCodesTotal = Math.round(safeCount * officialCodeUnitPrice * 100) / 100;
  const isOfficialCodeIncluded = Boolean(includeOfficialCodes);

  const tanboxServicesTotal = Math.round(productionSubtotal + layoutTotal + deliveryTotal + urgentAddition);
  const totalPrice = tanboxServicesTotal + (isOfficialCodeIncluded ? Math.round(officialCodesTotal) : 0);
  const effectiveUnitPrice = Number((totalPrice / safeCount).toFixed(2));

  let estDays = 1;
  let estimatedTimeText = '~1 день';

  if (tariffType === 'DIGITAL') {
    estDays = 1;
    if (isUrgent) {
      estimatedTimeText = 'от 1–2 часов (экспресс)';
    } else if (safeCount <= 10000) {
      estimatedTimeText = '2–4 часа (в день заказа)';
    } else {
      estimatedTimeText = 'в день заказа (~24 ч)';
    }
  } else if (isUrgent) {
    if (safeCount <= 5000) {
      estDays = 1;
      estimatedTimeText = 'экспресс (~24 часа)';
    } else if (safeCount <= 20000) {
      estDays = 2;
      estimatedTimeText = 'экспресс (~1–2 дня)';
    } else {
      estDays = 3;
      estimatedTimeText = 'экспресс (~2–3 дня)';
    }
  } else if (tariffType === 'PRO') {
    if (safeCount <= 2000) {
      estDays = 2;
      estimatedTimeText = '~1–2 дня';
    } else if (safeCount <= 10000) {
      estDays = 3;
      estimatedTimeText = '~2–3 дня';
    } else if (safeCount <= 50000) {
      estDays = 4;
      estimatedTimeText = '~3–4 дня';
    } else {
      estDays = 6;
      estimatedTimeText = '~5–7 дней';
    }
  } else {
    // PRINT and STANDARD
    if (safeCount <= 2000) {
      estDays = 1;
      estimatedTimeText = '~1 день';
    } else if (safeCount <= 10000) {
      estDays = 2;
      estimatedTimeText = '~1–2 дня';
    } else if (safeCount <= 50000) {
      estDays = 3;
      estimatedTimeText = '~2–3 дня';
    } else {
      estDays = 5;
      estimatedTimeText = '~3–5 дней';
    }
  }

  return {
    tariffType,
    itemsCount: safeCount,
    unitPrice: effectiveUnitPrice,
    baseUnitPrice,
    totalPrice,
    tanboxServicesTotal,
    estimatedMarginTotal: 0,
    consumableCostPerItem: 0,
    estimatedDays: estDays,
    estimatedTimeText,
    brackets,
    breakdown: {
      baseUnitPrice,
      baseBatchTotal,
      unitAdditions: resolvedBoxesCount > 0 ? Number((ssccBatchTotal / safeCount).toFixed(2)) : 0,
      flatAdditions: layoutTotal + deliveryTotal,
      ssccTotal: ssccBatchTotal,
      ssccPricePerBox,
      resolvedBoxesCount,
      isSsccIncludedInTariff: isSsccIncluded,
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
  };
};

export const useCalculator = () => {
  const [tariffType, setTariffType] = useState<TariffCode>('STANDARD');
  const [itemsCount, setItemsCount] = useState<number>(0);
  const [boxesCount, setBoxesCount] = useState<number>(0);
  const [ssccNeeded, setSsccNeeded] = useState<boolean>(false);
  const [extraServices, setExtraServices] = useState<string[]>([]);
  const [includeOfficialCodes, setIncludeOfficialCodes] = useState<boolean>(false);
  const [dbTariffs, setDbTariffs] = useState<TariffItem[]>([]);
  const [dbPricingSettings, setDbPricingSettings] = useState<PricingSettings | null>(null);
  const [result, setResult] = useState<CalculationResult>(() =>
    computeInstantPrice('STANDARD', 0, [], false, 0, false)
  );
  const [loading, setLoading] = useState<boolean>(false);

  // Load active tariffs & settings from DB on mount
  useEffect(() => {
    let active = true;
    apiClient
      .get('/tariffs')
      .then((res) => {
        if (!active) return;
        if (res.data?.tariffs && Array.isArray(res.data.tariffs)) {
          setDbTariffs(res.data.tariffs);
        }
        if (res.data?.pricingSettings) {
          setDbPricingSettings(res.data.pricingSettings);
        }
      })
      .catch((err) => {
        console.warn('Could not load tariffs from server:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  // Synchronize estimated box count when itemsCount changes if boxesCount was not manually customized
  useEffect(() => {
    if (itemsCount > 0 && (!boxesCount || boxesCount === 0)) {
      setBoxesCount(Math.max(1, Math.ceil(itemsCount / 20)));
    }
  }, [itemsCount]);

  useEffect(() => {
    // Instant local progressive calculation with current DB tariffs
    setResult(
      computeInstantPrice(
        tariffType,
        itemsCount,
        extraServices,
        ssccNeeded,
        boxesCount,
        includeOfficialCodes,
        dbTariffs,
        dbPricingSettings
      )
    );

    if (itemsCount <= 0) {
      return;
    }

    // Authoritative backend calculation
    let isCancelled = false;
    apiClient
      .post('/calculator/calculate', {
        tariffType,
        itemsCount,
        boxesCount: boxesCount > 0 ? boxesCount : undefined,
        extraServices,
        ssccNeeded,
        includeOfficialCodeFee: includeOfficialCodes,
      })
      .then((res) => {
        if (!isCancelled && res.data) {
          setResult({
            tariffType: res.data.tariffType || tariffType,
            itemsCount: res.data.itemsCount || itemsCount,
            unitPrice: res.data.unitPrice,
            baseUnitPrice: res.data.baseUnitPrice ?? res.data.details?.unitBasePrice,
            totalPrice: res.data.totalPrice,
            tanboxServicesTotal: res.data.tanboxServicesTotal ?? res.data.totalPrice,
            estimatedMarginTotal: 0,
            consumableCostPerItem: 0,
            estimatedDays: res.data.estimatedDays ?? res.data.estDays ?? 1,
            estimatedTimeText: res.data.estimatedTimeText,
            brackets: res.data.brackets,
            breakdown: res.data.breakdown ?? {
              baseUnitPrice: res.data.details?.unitBasePrice ?? res.data.unitPrice,
              unitAdditions: res.data.details?.unitAdditions ?? 0,
              flatAdditions: res.data.details?.flatAdditions ?? 0,
              isUrgent: extraServices.includes('URGENT_PROCESSING'),
            },
          });
        }
      })
      .catch(() => {
        // Silently use instant calculation
      });

    return () => {
      isCancelled = true;
    };
  }, [
    tariffType,
    itemsCount,
    boxesCount,
    ssccNeeded,
    extraServices,
    includeOfficialCodes,
    dbTariffs,
    dbPricingSettings,
  ]);

  const toggleExtraService = (serviceCode: string) => {
    setExtraServices((prev) =>
      prev.includes(serviceCode)
        ? prev.filter((s) => s !== serviceCode)
        : [...prev, serviceCode]
    );
  };

  return {
    tariffType,
    setTariffType,
    itemsCount,
    setItemsCount,
    boxesCount,
    setBoxesCount,
    ssccNeeded,
    setSsccNeeded,
    extraServices,
    toggleExtraService,
    includeOfficialCodes,
    setIncludeOfficialCodes,
    result,
    loading,
    dbTariffs,
    dbPricingSettings,
  };
};
