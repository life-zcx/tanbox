export type TariffCode = 'DIGITAL' | 'PRINT' | 'STANDARD' | 'PRO';

export interface TariffItem {
  code: TariffCode;
  name: string;
  description: string;
  fitFor: string;
  priceRange?: string;
  marginEst?: string;
  priceMin: number;
  priceMax: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceLargeWholesale?: number;
}

export interface PricingSettings {
  ssccPrice: number;
  stickerLayoutPrice: number;
  selfLayoutPrice?: number;
  urgentPercent: number;
  expressDeliveryPrice: number;
  volumeTier1: number;
  volumeTier2: number;
  outsourcingOneTimePrice?: number;
  outsourcingTier1Price?: number;
  outsourcingTier2Price?: number;
  outsourcingTier3Price?: number;
  outsourcingTier4Price?: number;
  cardNktPrice?: number;
  cardMptPrice?: number;
  cardFullPackagePrice?: number;
  trainingCoursePrice?: number;
}

export interface PriceBracket {
  tier: 'RETAIL' | 'WHOLESALE' | 'LARGE_WHOLESALE';
  label: string;
  from: number;
  to: number | null;
  rate: number;
  count: number;
  subtotal: number;
}

export interface CalculationResult {
  tariffType: TariffCode;
  itemsCount: number;
  unitPrice: number;
  baseUnitPrice?: number;
  totalPrice: number;
  tanboxServicesTotal?: number;
  estimatedMarginTotal: number;
  consumableCostPerItem: number;
  estimatedDays: number;
  estimatedTimeText?: string;
  brackets?: PriceBracket[];
  breakdown: {
    baseUnitPrice: number;
    baseBatchTotal?: number;
    unitAdditions: number;
    flatAdditions: number;
    ssccTotal?: number;
    ssccPricePerBox?: number;
    resolvedBoxesCount?: number;
    isSsccIncludedInTariff?: boolean;
    layoutTotal?: number;
    layoutType?: 'NONE' | 'DESIGNER' | 'CLIENT_APPROVAL';
    deliveryTotal?: number;
    isUrgent: boolean;
    urgentPercent?: number;
    urgentAddition?: number;
    officialCodeUnitPrice?: number;
    officialCodesTotal?: number;
    isOfficialCodeIncluded?: boolean;
    tier?: 'LARGE_WHOLESALE' | 'WHOLESALE' | 'RETAIL';
  };
}
