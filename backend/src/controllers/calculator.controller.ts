import { Request, Response } from 'express';
import { TariffType } from '@prisma/client';
import { computeOrderPricing } from '../utils/pricing';

export const calculatePrice = async (req: Request, res: Response) => {
  try {
    const { tariffType, itemsCount, extraServices = [], ssccNeeded = false } = req.body;

    if (!tariffType || !itemsCount) {
      return res.status(400).json({ message: 'Некорректные параметры расчета' });
    }

    if (!Object.values(TariffType).includes(tariffType as TariffType)) {
      return res.status(400).json({ message: 'Недопустимый тариф' });
    }

    const countNum = parseInt(itemsCount, 10);
    if (isNaN(countNum) || countNum <= 0) {
      return res.status(400).json({ message: 'Количество должно быть положительным числом' });
    }

    const pricing = await computeOrderPricing({
      tariffType: tariffType as TariffType,
      itemsCount: countNum,
      extraServices: Array.isArray(extraServices) ? extraServices.map(String) : [],
      ssccNeeded: Boolean(ssccNeeded),
    });

    // Return sanitized public result without confidential costEstimate/unitMargin
    return res.json({
      tariffType,
      itemsCount: pricing.safeItemsCount,
      unitPrice: pricing.unitPrice,
      totalPrice: pricing.totalPrice,
      estDays: pricing.estDays,
      details: {
        unitBasePrice: pricing.details.unitBasePrice,
        unitAdditions: pricing.details.unitAdditions,
        flatAdditions: pricing.details.flatAdditions,
        tier: pricing.details.tier,
      },
    });
  } catch (error: any) {
    console.error('Calculation error:', error);
    return res.status(500).json({ message: 'Ошибка при расчёте стоимости маркировки' });
  }
};
