import { Request, Response } from 'express';
import { TariffType } from '@prisma/client';
import { computeOrderPricing } from '../utils/pricing';

export const calculatePrice = async (req: Request, res: Response) => {
  try {
    const {
      tariffType,
      itemsCount,
      boxesCount,
      extraServices = [],
      ssccNeeded = false,
      includeOfficialCodeFee = false,
    } = req.body;

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

    const parsedBoxes = boxesCount !== undefined ? parseInt(String(boxesCount), 10) : undefined;

    const pricing = await computeOrderPricing({
      tariffType: tariffType as TariffType,
      itemsCount: countNum,
      boxesCount: parsedBoxes && !isNaN(parsedBoxes) && parsedBoxes > 0 ? parsedBoxes : undefined,
      extraServices: Array.isArray(extraServices) ? extraServices.map(String) : [],
      ssccNeeded: Boolean(ssccNeeded),
      includeOfficialCodeFee: Boolean(includeOfficialCodeFee),
    });

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Return sanitized public result without confidential costEstimate/unitMargin
    return res.json({
      tariffType,
      itemsCount: pricing.safeItemsCount,
      unitPrice: pricing.unitPrice,
      baseUnitPrice: pricing.baseUnitPrice,
      totalPrice: pricing.totalPrice,
      tanboxServicesTotal: pricing.tanboxServicesTotal,
      estDays: pricing.estDays,
      estimatedDays: pricing.estDays,
      estimatedTimeText: pricing.estimatedTimeText,
      estimatedMarginTotal: 0,
      consumableCostPerItem: 0,
      brackets: pricing.brackets,
      breakdown: {
        baseUnitPrice: pricing.baseUnitPrice,
        baseBatchTotal: pricing.breakdown.baseBatchTotal,
        unitAdditions: pricing.details.unitAdditions,
        flatAdditions: pricing.details.flatAdditions,
        ssccTotal: pricing.breakdown.ssccTotal,
        ssccPricePerBox: pricing.breakdown.ssccPricePerBox,
        resolvedBoxesCount: pricing.breakdown.resolvedBoxesCount,
        isSsccIncludedInTariff: pricing.breakdown.isSsccIncludedInTariff,
        layoutTotal: pricing.breakdown.layoutTotal,
        layoutType: pricing.breakdown.layoutType,
        deliveryTotal: pricing.breakdown.deliveryTotal,
        isUrgent: pricing.breakdown.isUrgent,
        urgentPercent: pricing.breakdown.urgentPercent,
        urgentAddition: pricing.breakdown.urgentAddition,
        officialCodeUnitPrice: pricing.breakdown.officialCodeUnitPrice,
        officialCodesTotal: pricing.breakdown.officialCodesTotal,
        isOfficialCodeIncluded: pricing.breakdown.isOfficialCodeIncluded,
        tier: pricing.breakdown.tier,
      },
      details: pricing.details,
    });
  } catch (error: any) {
    console.error('Calculation error:', error);
    return res.status(500).json({ message: 'Ошибка при расчёте стоимости маркировки' });
  }
};
