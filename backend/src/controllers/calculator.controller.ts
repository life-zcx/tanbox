import { Request, Response } from 'express';

interface CalculationRequest {
  tariffType: 'DIGITAL' | 'PRINT' | 'STANDARD' | 'PRO';
  itemsCount: number;
  extraServices?: string[];
  ssccNeeded?: boolean;
}

export const calculatePrice = (req: Request, res: Response) => {
  try {
    const { tariffType, itemsCount, extraServices = [], ssccNeeded = false }: CalculationRequest = req.body;

    if (!tariffType || !itemsCount || itemsCount <= 0) {
      return res.status(400).json({ message: 'Некорректные параметры расчета' });
    }

    // Base unit price range & margin estimation per tariff
    let basePriceMin = 10;
    let basePriceMax = 15;
    let marginEstMin = 10;
    let marginEstMax = 15;
    let consumableCost = 0;

    switch (tariffType) {
      case 'DIGITAL':
        basePriceMin = 10;
        basePriceMax = 15;
        marginEstMin = 10;
        marginEstMax = 15;
        consumableCost = 0;
        break;
      case 'PRINT':
        basePriceMin = 25;
        basePriceMax = 35;
        marginEstMin = 22;
        marginEstMax = 32;
        consumableCost = 3;
        break;
      case 'STANDARD':
        basePriceMin = 50;
        basePriceMax = 65;
        marginEstMin = 40;
        marginEstMax = 55;
        consumableCost = 10;
        break;
      case 'PRO':
        basePriceMin = 90;
        basePriceMax = 120;
        marginEstMin = 75;
        marginEstMax = 105;
        consumableCost = 15;
        break;
    }

    // Dynamic price based on volume
    let unitPrice = basePriceMax;
    if (itemsCount > 100000) {
      unitPrice = basePriceMin;
    } else if (itemsCount > 20000) {
      unitPrice = Math.round((basePriceMin + basePriceMax) / 2);
    }

    // Extra services calculations
    let flatAdditions = 0;
    let unitAdditions = 0;

    if (ssccNeeded || extraServices.includes('SSCC_AGGREGATION')) {
      unitAdditions += 5; // +5 ₸/item for SSCC code generation & aggregation
    }
    if (extraServices.includes('STICKER_LAYOUT_DESIGN')) {
      flatAdditions += 5000; // Flat 5,000 ₸ for custom sticker template layout
    }
    if (extraServices.includes('EXPRESS_DELIVERY')) {
      flatAdditions += 15000; // Express logistic delivery in KZ
    }

    const finalUnitPrice = unitPrice + unitAdditions;
    let totalPrice = finalUnitPrice * itemsCount + flatAdditions;

    if (extraServices.includes('URGENT_PROCESSING')) {
      totalPrice *= 1.2; // 20% surcharge for 24h urgent processing
    }

    totalPrice = Math.round(totalPrice);

    // Estimated execution time
    let estDays = 1;
    if (itemsCount > 50000) estDays = 5;
    else if (itemsCount > 10000) estDays = 3;
    else if (itemsCount > 2000) estDays = 2;

    const estimatedMarginTotal = Math.round((marginEstMax * itemsCount) * 0.85);

    return res.json({
      tariffType,
      itemsCount,
      unitPrice: finalUnitPrice,
      totalPrice,
      estimatedMarginTotal,
      consumableCostPerItem: consumableCost,
      estimatedDays: estDays,
      breakdown: {
        baseUnitPrice: unitPrice,
        unitAdditions,
        flatAdditions,
        isUrgent: extraServices.includes('URGENT_PROCESSING'),
      },
    });
  } catch (error: any) {
    console.error('Calculate price error:', error);
    return res.status(500).json({ message: 'Ошибка сервера при расчете стоимости' });
  }
};
