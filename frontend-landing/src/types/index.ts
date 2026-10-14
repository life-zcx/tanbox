export type TariffCode = 'DIGITAL' | 'PRINT' | 'STANDARD' | 'PRO';

export interface TariffItem {
  code: TariffCode;
  name: string;
  description: string;
  fitFor: string;
  priceRange: string;
  marginEst: string;
  priceMin: number;
  priceMax: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceLargeWholesale?: number;
}

export interface PricingSettings {
  ssccPrice: number;
  stickerLayoutPrice: number;
  urgentPercent: number;
  expressDeliveryPrice: number;
  volumeTier1: number;
  volumeTier2: number;
}

export interface CalculationResult {
  tariffType: TariffCode;
  itemsCount: number;
  unitPrice: number;
  totalPrice: number;
  estimatedMarginTotal: number;
  consumableCostPerItem: number;
  estimatedDays: number;
  breakdown: {
    baseUnitPrice: number;
    unitAdditions: number;
    flatAdditions: number;
    isUrgent: boolean;
  };
}
