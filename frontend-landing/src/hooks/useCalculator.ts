import { useState, useEffect } from 'react';
import { TariffCode, CalculationResult, TariffItem, PricingSettings } from '../types';
import { apiClient } from '../api/client';

export const computeInstantPrice = (
  tariffType: TariffCode,
  itemsCount: number,
  extraServices: string[],
  ssccNeeded: boolean,
  dbTariffs?: TariffItem[],
  dbSettings?: PricingSettings | null
): CalculationResult => {
  const found = dbTariffs?.find((t) => t.code === tariffType);
  const tier1 = dbSettings?.volumeTier1 ?? 20000;
  const tier2 = dbSettings?.volumeTier2 ?? 100000;

  // Fallbacks if not yet loaded from DB
  const fallbackPrices: Record<string, { retail: number; wholesale: number; large: number }> = {
    DIGITAL: { retail: 15, wholesale: 12, large: 10 },
    PRINT: { retail: 35, wholesale: 30, large: 25 },
    STANDARD: { retail: 65, wholesale: 55, large: 50 },
    PRO: { retail: 120, wholesale: 105, large: 90 },
  };

  const f = fallbackPrices[tariffType] || fallbackPrices.STANDARD;
  const priceRetail = found?.priceRetail ?? f.retail;
  const priceWholesale = found?.priceWholesale ?? f.wholesale;
  const priceLargeWholesale = found?.priceLargeWholesale ?? f.large;

  let unitPrice = priceRetail;
  if (itemsCount > tier2) {
    unitPrice = priceLargeWholesale;
  } else if (itemsCount > tier1) {
    unitPrice = priceWholesale;
  }

  const ssccPrice = dbSettings?.ssccPrice ?? 5;
  const stickerLayoutPrice = dbSettings?.stickerLayoutPrice ?? 5000;
  const expressDeliveryPrice = dbSettings?.expressDeliveryPrice ?? 15000;
  const urgentPercent = dbSettings?.urgentPercent ?? 20;

  let flatAdditions = 0;
  let unitAdditions = 0;

  if (ssccNeeded || extraServices.includes('SSCC_AGGREGATION')) {
    unitAdditions += ssccPrice;
  }
  if (extraServices.includes('STICKER_LAYOUT_DESIGN')) {
    flatAdditions += stickerLayoutPrice;
  }
  if (extraServices.includes('EXPRESS_DELIVERY')) {
    flatAdditions += expressDeliveryPrice;
  }

  const finalUnitPrice = Number((unitPrice + unitAdditions).toFixed(2));
  let totalPrice = itemsCount > 0 ? (finalUnitPrice * itemsCount + flatAdditions) : 0;

  const isUrgent = extraServices.includes('URGENT_PROCESSING');
  if (isUrgent && itemsCount > 0) {
    totalPrice *= 1 + urgentPercent / 100;
  }
  totalPrice = Math.round(totalPrice);

  let estDays = 1;
  if (itemsCount > 50000) estDays = 5;
  else if (itemsCount > 10000) estDays = 3;
  else if (itemsCount > 2000) estDays = 2;

  return {
    tariffType,
    itemsCount,
    unitPrice: finalUnitPrice,
    totalPrice,
    estimatedMarginTotal: 0,
    consumableCostPerItem: 0,
    estimatedDays: estDays,
    breakdown: {
      baseUnitPrice: unitPrice,
      unitAdditions,
      flatAdditions,
      isUrgent,
    },
  };
};

export const useCalculator = () => {
  const [tariffType, setTariffType] = useState<TariffCode>('STANDARD');
  const [itemsCount, setItemsCount] = useState<number>(0);
  const [ssccNeeded, setSsccNeeded] = useState<boolean>(false);
  const [extraServices, setExtraServices] = useState<string[]>([]);
  const [dbTariffs, setDbTariffs] = useState<TariffItem[]>([]);
  const [dbPricingSettings, setDbPricingSettings] = useState<PricingSettings | null>(null);
  const [result, setResult] = useState<CalculationResult>(() =>
    computeInstantPrice('STANDARD', 0, [], false)
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

  useEffect(() => {
    // Instant local calculation with current DB tariffs
    setResult(computeInstantPrice(tariffType, itemsCount, extraServices, ssccNeeded, dbTariffs, dbPricingSettings));

    if (itemsCount <= 0) {
      return;
    }

    // Authoritative backend calculation
    let isCancelled = false;
    apiClient
      .post('/calculator/calculate', {
        tariffType,
        itemsCount,
        extraServices,
        ssccNeeded,
      })
      .then((res) => {
        if (!isCancelled && res.data) {
          setResult({
            ...res.data,
            estimatedDays: res.data.estimatedDays ?? res.data.estDays ?? 1,
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
  }, [tariffType, itemsCount, ssccNeeded, extraServices, dbTariffs, dbPricingSettings]);

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
    ssccNeeded,
    setSsccNeeded,
    extraServices,
    toggleExtraService,
    result,
    loading,
    dbTariffs,
    dbPricingSettings,
  };
};
