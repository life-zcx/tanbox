import type { PricingSettings, TariffCode, TariffItem } from '../types';

export interface PublicPricing {
  tariffs: TariffItem[];
  pricingSettings: PricingSettings;
}

// Public fallback matches the active rates verified on 2026-11-06. The build
// embeds a fresh public snapshot; the browser refreshes it without authentication.
export const DEFAULT_PUBLIC_PRICING: PublicPricing = {
  tariffs: [
    { code: 'DIGITAL', name: 'Digital', description: '', fitFor: '', priceRetail: 6, priceWholesale: 5, priceLargeWholesale: 4, priceMin: 4, priceMax: 6 },
    { code: 'PRINT', name: 'Print', description: '', fitFor: '', priceRetail: 18, priceWholesale: 16, priceLargeWholesale: 13, priceMin: 13, priceMax: 18 },
    { code: 'STANDARD', name: 'Standard', description: '', fitFor: '', priceRetail: 42, priceWholesale: 39, priceLargeWholesale: 32, priceMin: 32, priceMax: 42 },
    { code: 'PRO', name: 'PRO', description: '', fitFor: '', priceRetail: 72, priceWholesale: 65, priceLargeWholesale: 55, priceMin: 55, priceMax: 72 },
  ],
  pricingSettings: {
    ssccPrice: 50, stickerLayoutPrice: 5000, selfLayoutPrice: 1000,
    urgentPercent: 25, expressDeliveryPrice: 15000, volumeTier1: 5000, volumeTier2: 25000,
    outsourcingOneTimePrice: 79900, outsourcingTier1Price: 119900,
    outsourcingTier2Price: 189900, outsourcingTier3Price: 349900, outsourcingTier4Price: 549900,
    cardNktPrice: 150, cardMptPrice: 200, cardFullPackagePrice: 300, trainingCoursePrice: 85000,
  },
};

export function normalizePublicPricing(value: unknown): PublicPricing {
  if (!value || typeof value !== 'object') throw new Error('Missing public pricing');
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.tariffs) || !data.pricingSettings || typeof data.pricingSettings !== 'object') {
    throw new Error('Invalid public pricing response');
  }
  const tariffs = DEFAULT_PUBLIC_PRICING.tariffs.map(fallback => {
    const input = (data.tariffs as Array<Record<string, unknown>>).find(t => t.code === fallback.code);
    if (!input) throw new Error(`Missing tariff ${fallback.code}`);
    const rates = ['priceRetail', 'priceWholesale', 'priceLargeWholesale'] as const;
    for (const key of rates) {
      if (!Number.isFinite(Number(input[key])) || Number(input[key]) < 0) throw new Error(`Invalid ${key}`);
    }
    return { ...fallback, ...Object.fromEntries(rates.map(key => [key, Number(input[key])])),
      priceMin: Math.min(...rates.map(key => Number(input[key]))),
      priceMax: Math.max(...rates.map(key => Number(input[key]))) };
  });
  const settings = { ...DEFAULT_PUBLIC_PRICING.pricingSettings };
  for (const key of Object.keys(settings) as Array<keyof PricingSettings>) {
    const num = Number((data.pricingSettings as Record<string, unknown>)[key]);
    if (Number.isFinite(num) && num >= 0) settings[key] = num;
  }
  if (settings.volumeTier1 < 1 || settings.volumeTier2 <= settings.volumeTier1) throw new Error('Invalid volume tiers');
  return { tariffs, pricingSettings: settings };
}

export function tariffRate(pricing: PublicPricing, code: TariffCode, tier: 'priceRetail' | 'priceWholesale' | 'priceLargeWholesale' = 'priceRetail'): number {
  return pricing.tariffs.find(t => t.code === code)?.[tier] ?? DEFAULT_PUBLIC_PRICING.tariffs.find(t => t.code === code)![tier]!;
}
