import { useState, useEffect } from 'react';
import { TariffCode, CalculationResult } from '../types';
import { apiClient } from '../api/client';

export const useCalculator = () => {
  const [tariffType, setTariffType] = useState<TariffCode>('STANDARD');
  const [itemsCount, setItemsCount] = useState<number>(10000);
  const [ssccNeeded, setSsccNeeded] = useState<boolean>(false);
  const [extraServices, setExtraServices] = useState<string[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const calculate = async () => {
      setLoading(true);
      try {
        const response = await apiClient.post('/calculator/calculate', {
          tariffType,
          itemsCount,
          extraServices,
          ssccNeeded,
        });
        setResult(response.data);
      } catch (err) {
        console.error('Failed to calculate price:', err);
      } finally {
        setLoading(false);
      }
    };

    calculate();
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
