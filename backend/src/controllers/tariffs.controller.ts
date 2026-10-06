import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

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
          urgentPercent: 20,
          expressDeliveryPrice: 15000,
          volumeTier1: 20000,
          volumeTier2: 100000,
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

    // Sanitize tariffs for non-admins to prevent confidential pricing & margin disclosure
    const tariffs = isAdmin
      ? rawTariffs
      : rawTariffs.map(({ costEstimate, marginEst, ...publicData }) => publicData);

    return res.json({ tariffs, pricingSettings });
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
        const cEstimate = Math.max(0, Number(t.costEstimate || 0));

        await prisma.tariff.update({
          where: { code: t.code },
          data: {
            name: typeof t.name === 'string' ? t.name : undefined,
            description: typeof t.description === 'string' ? t.description : undefined,
            fitFor: typeof t.fitFor === 'string' ? t.fitFor : undefined,
            priceRetail: pRetail,
            priceWholesale: pWholesale,
            priceLargeWholesale: pLarge,
            costEstimate: cEstimate,
            priceMin: Math.min(pLarge, pWholesale, pRetail),
            priceMax: Math.max(pLarge, pWholesale, pRetail),
            marginEst: typeof t.marginEst === 'string' ? t.marginEst : '',
          },
        });
      }
    }

    // Update global pricing settings with bounds validation
    if (pricingSettings) {
      const safeSscc = Math.max(0, Number(pricingSettings.ssccPrice) || 5);
      const safeLayout = Math.max(0, Number(pricingSettings.stickerLayoutPrice) || 5000);
      const safeUrgent = Math.min(200, Math.max(0, Number(pricingSettings.urgentPercent) || 20));
      const safeExpress = Math.max(0, Number(pricingSettings.expressDeliveryPrice) || 15000);
      const safeTier1 = Math.max(100, Math.floor(Number(pricingSettings.volumeTier1) || 20000));
      const safeTier2 = Math.max(safeTier1 + 100, Math.floor(Number(pricingSettings.volumeTier2) || 100000));

      await prisma.pricingSettings.upsert({
        where: { key: 'GLOBAL' },
        update: {
          ssccPrice: safeSscc,
          stickerLayoutPrice: safeLayout,
          urgentPercent: safeUrgent,
          expressDeliveryPrice: safeExpress,
          volumeTier1: safeTier1,
          volumeTier2: safeTier2,
        },
        create: {
          key: 'GLOBAL',
          ssccPrice: safeSscc,
          stickerLayoutPrice: safeLayout,
          urgentPercent: safeUrgent,
          expressDeliveryPrice: safeExpress,
          volumeTier1: safeTier1,
          volumeTier2: safeTier2,
        },
      });
    }

    const updatedTariffs = await prisma.tariff.findMany({ orderBy: { code: 'asc' } });
    const updatedSettings = await prisma.pricingSettings.findUnique({ where: { key: 'GLOBAL' } });

    return res.json({
      message: 'Тарифы и настройки цен успешно обновлены',
      tariffs: updatedTariffs,
      pricingSettings: updatedSettings,
    });
  } catch (error: any) {
    console.error('Error updating tariffs:', error);
    return res.status(500).json({ message: 'Ошибка при сохранении тарифов' });
  }
};
