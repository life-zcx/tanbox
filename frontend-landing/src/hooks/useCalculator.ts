import { useState, useEffect } from 'react';
import { TariffCode, CalculationResult } from '../types';
import { apiClient } from '../api/client';

export const computeInstantPrice = (
  tariffType: TariffCode,
  itemsCount: number,
  extraServices: string[],
  ssccNeeded: boolean
): CalculationResult => {
  let basePriceMin = 10;
  let basePriceMax = 15;

  switch (tariffType) {
    case 'DIGITAL':
      basePriceMin = 10;
      basePriceMax = 15;
      break;
    case 'PRINT':
      basePriceMin = 25;
      basePriceMax = 35;
      break;
    case 'STANDARD':
      basePriceMin = 50;
      basePriceMax = 65;
      break;
    case 'PRO':
      basePriceMin = 90;
      basePriceMax = 120;
      break;
  }

  let unitPrice = basePriceMax;
  if (itemsCount > 100000) {
    unitPrice = basePriceMin;
  } else if (itemsCount > 20000) {
    unitPrice = Math.round((basePriceMin + basePriceMax) / 2);
  }

  let flatAdditions = 0;
  let unitAdditions = 0;

  if (ssccNeeded || extraServices.includes('SSCC_AGGREGATION')) {
    unitAdditions += 5;
  }
  if (extraServices.includes('STICKER_LAYOUT_DESIGN')) {
    flatAdditions += 5000;
  }
  if (extraServices.includes('EXPRESS_DELIVERY')) {
    flatAdditions += 15000;
  }

  const finalUnitPrice = unitPrice + unitAdditions;
  let totalPrice = finalUnitPrice * itemsCount + flatAdditions;

  const isUrgent = extraServices.includes('URGENT_PROCESSING');
  if (isUrgent) {
    totalPrice *= 1.2;
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
  const [itemsCount, setItemsCount] = useState<number>(10000);
  const [ssccNeeded, setSsccNeeded] = useState<boolean>(false);
  const [extraServices, setExtraServices] = useState<string[]>([]);
  const [result, setResult] = useState<CalculationResult>(() =>
    computeInstantPrice('STANDARD', 10000, [], false)
  );
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Instant local calculation for 0ms lag
    setResult(computeInstantPrice(tariffType, itemsCount, extraServices, ssccNeeded));

    // Optional background sync with backend
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
          setResult(res.data);
        }
      })
      .catch(() => {
        // Silently use instant calculation
      });

    return () => {
      isCancelled = true;
    };
  }, [tariffType, itemsCount, ssccNeeded, extraServices]);

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
  };
};
