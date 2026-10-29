import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const formatTariff = (t: any, isAdmin: boolean) => ({
  id: t.id,
  code: t.code,
  name: t.name,
  description: t.description,
  fitFor: t.fitFor,
  priceRetail: Number(t.priceRetail) || 0,
  priceWholesale: Number(t.priceWholesale) || 0,
  priceLargeWholesale: Number(t.priceLargeWholesale) || 0,
  priceMin: Number(t.priceMin) || 0,
  priceMax: Number(t.priceMax) || 0,
  ...(isAdmin
    ? {
        costEstimate: Number(t.costEstimate) || 0,
        marginEst: t.marginEst || '',
      }
    : {}),
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});

const formatPricingSettings = (s: any) => ({
  id: s.id,
  key: s.key,
  ssccPrice: Number(s.ssccPrice) || 0,
  stickerLayoutPrice: Number(s.stickerLayoutPrice) || 0,
  selfLayoutPrice: Number(s.selfLayoutPrice) || 1000,
  urgentPercent: Number(s.urgentPercent) || 0,
  expressDeliveryPrice: Number(s.expressDeliveryPrice) || 0,
  volumeTier1: Math.floor(Number(s.volumeTier1) || 20000),
  volumeTier2: Math.floor(Number(s.volumeTier2) || 100000),
  outsourcingOneTimePrice: Number(s.outsourcingOneTimePrice) || 100000,
  outsourcingTier1Price: Number(s.outsourcingTier1Price) || 200000,
  outsourcingTier2Price: Number(s.outsourcingTier2Price) || 300000,
  outsourcingTier3Price: Number(s.outsourcingTier3Price) || 400000,
  outsourcingTier4Price: Number(s.outsourcingTier4Price) || 500000,
  cardNktPrice: Number(s.cardNktPrice) || 200,
  cardMptPrice: Number(s.cardMptPrice) || 300,
  cardFullPackagePrice: Number(s.cardFullPackagePrice) || 400,
  trainingCoursePrice: Number(s.trainingCoursePrice) || 100000,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

export const getTariffs = async (req: Request, res: Response) => {
  try {
    const rawTariffs = await prisma.tariff.findMany({
      orderBy: { code: 'asc' },
    });

    let pricingSettings = await prisma.pricingSettings.findUnique({
      where: { key: 'GLOBAL' },
    });

    if (!pricingSettings) {
      pricingSettings = await prisma.pricingSettings.create({
        data: {
          key: 'GLOBAL',
          ssccPrice: 5,
          stickerLayoutPrice: 5000,
          selfLayoutPrice: 1000,
          urgentPercent: 20,
          expressDeliveryPrice: 15000,
          volumeTier1: 20000,
          volumeTier2: 100000,
          outsourcingOneTimePrice: 100000,
          outsourcingTier1Price: 200000,
          outsourcingTier2Price: 300000,
          outsourcingTier3Price: 400000,
          outsourcingTier4Price: 500000,
          cardNktPrice: 200,
          cardMptPrice: 300,
          cardFullPackagePrice: 400,
          trainingCoursePrice: 100000,
        },
      });
    }

    // Check if requester is Admin
    let isAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        if (decoded?.role === Role.ADMIN) {
          isAdmin = true;
        }
      } catch {
        // Not admin or invalid token, treat as public
      }
    }

    return res.json({
      tariffs: rawTariffs.map((t) => formatTariff(t, isAdmin)),
      pricingSettings: formatPricingSettings(pricingSettings),
    });
  } catch (error: any) {
    console.error('Error fetching tariffs:', error);
    return res.status(500).json({ message: 'Ошибка при получении тарифов' });
  }
};

export const updateTariffs = async (req: AuthRequest, res: Response) => {
  try {
    const { tariffs, pricingSettings } = req.body;

    // Update each tariff's exact pricing with bounds validation
    if (Array.isArray(tariffs)) {
      for (const t of tariffs) {
        if (!t.code) continue;

        const pRetail = Math.max(0.1, Number(t.priceRetail) || 0);
        const pWholesale = Math.max(0.1, Number(t.priceWholesale) || pRetail);
        const pLarge = Math.max(0.1, Number(t.priceLargeWholesale) || pWholesale);
        const cEstimate = Math.max(0, Number(t.costEstimate) || 0);

        await prisma.tariff.update({
          where: { code: t.code },
          data: {
            name: typeof t.name === 'string' && t.name.trim() ? t.name : undefined,
            description: typeof t.description === 'string' ? t.description : undefined,
            fitFor: typeof t.fitFor === 'string' ? t.fitFor : undefined,
            priceRetail: pRetail,
            priceWholesale: pWholesale,
            priceLargeWholesale: pLarge,
            costEstimate: cEstimate,
            priceMin: Math.min(pLarge, pWholesale, pRetail),
            priceMax: Math.max(pLarge, pWholesale, pRetail),
            marginEst: typeof t.marginEst === 'string' ? t.marginEst : undefined,
          },
        });
      }
    }

    // Update global pricing settings with bounds validation
    if (pricingSettings) {
      const toSafeNum = (val: any, fallback: number) => {
        const n = Number(val);
        return Number.isFinite(n) ? n : fallback;
      };

      const safeSscc = Math.max(0, toSafeNum(pricingSettings.ssccPrice, 5));
      const safeLayout = Math.max(0, toSafeNum(pricingSettings.stickerLayoutPrice, 5000));
      const safeSelfLayout = Math.max(0, toSafeNum(pricingSettings.selfLayoutPrice, 1000));
      const safeUrgent = Math.min(200, Math.max(0, toSafeNum(pricingSettings.urgentPercent, 20)));
      const safeExpress = Math.max(0, toSafeNum(pricingSettings.expressDeliveryPrice, 15000));
      const safeTier1 = Math.max(100, Math.floor(toSafeNum(pricingSettings.volumeTier1, 20000)));
      const safeTier2 = Math.max(safeTier1 + 100, Math.floor(toSafeNum(pricingSettings.volumeTier2, 100000)));

      const safeOutsourcingOneTime = Math.max(0, toSafeNum(pricingSettings.outsourcingOneTimePrice, 100000));
      const safeOutsourcingTier1 = Math.max(0, toSafeNum(pricingSettings.outsourcingTier1Price, 200000));
      const safeOutsourcingTier2 = Math.max(0, toSafeNum(pricingSettings.outsourcingTier2Price, 300000));
      const safeOutsourcingTier3 = Math.max(0, toSafeNum(pricingSettings.outsourcingTier3Price, 400000));
      const safeOutsourcingTier4 = Math.max(0, toSafeNum(pricingSettings.outsourcingTier4Price, 500000));

      const safeCardNkt = Math.max(0, toSafeNum(pricingSettings.cardNktPrice, 200));
      const safeCardMpt = Math.max(0, toSafeNum(pricingSettings.cardMptPrice, 300));
      const safeCardFull = Math.max(0, toSafeNum(pricingSettings.cardFullPackagePrice, 400));

      const safeTrainingCourse = Math.max(0, toSafeNum(pricingSettings.trainingCoursePrice, 100000));

      await prisma.pricingSettings.upsert({
        where: { key: 'GLOBAL' },
        update: {
          ssccPrice: safeSscc,
          stickerLayoutPrice: safeLayout,
          selfLayoutPrice: safeSelfLayout,
          urgentPercent: safeUrgent,
          expressDeliveryPrice: safeExpress,
          volumeTier1: safeTier1,
          volumeTier2: safeTier2,
          outsourcingOneTimePrice: safeOutsourcingOneTime,
          outsourcingTier1Price: safeOutsourcingTier1,
          outsourcingTier2Price: safeOutsourcingTier2,
          outsourcingTier3Price: safeOutsourcingTier3,
          outsourcingTier4Price: safeOutsourcingTier4,
          cardNktPrice: safeCardNkt,
          cardMptPrice: safeCardMpt,
          cardFullPackagePrice: safeCardFull,
          trainingCoursePrice: safeTrainingCourse,
        },
        create: {
          key: 'GLOBAL',
          ssccPrice: safeSscc,
          stickerLayoutPrice: safeLayout,
          selfLayoutPrice: safeSelfLayout,
          urgentPercent: safeUrgent,
          expressDeliveryPrice: safeExpress,
          volumeTier1: safeTier1,
          volumeTier2: safeTier2,
          outsourcingOneTimePrice: safeOutsourcingOneTime,
          outsourcingTier1Price: safeOutsourcingTier1,
          outsourcingTier2Price: safeOutsourcingTier2,
          outsourcingTier3Price: safeOutsourcingTier3,
          outsourcingTier4Price: safeOutsourcingTier4,
          cardNktPrice: safeCardNkt,
          cardMptPrice: safeCardMpt,
          cardFullPackagePrice: safeCardFull,
          trainingCoursePrice: safeTrainingCourse,
        },
      });
    }

    const updatedTariffs = await prisma.tariff.findMany({ orderBy: { code: 'asc' } });
    const updatedSettings = await prisma.pricingSettings.findUnique({ where: { key: 'GLOBAL' } });

    return res.json({
      message: 'Тарифы и настройки цен успешно обновлены',
      tariffs: updatedTariffs.map((t) => formatTariff(t, true)),
      pricingSettings: updatedSettings ? formatPricingSettings(updatedSettings) : null,
    });
  } catch (error: any) {
    console.error('Error updating tariffs:', error);
    return res.status(500).json({ message: 'Ошибка при сохранении тарифов: ' + (error.message || 'Внутренняя ошибка') });
  }
};
