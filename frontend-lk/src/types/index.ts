export type OrderStatus = 'NEW' | 'PROCESSING' | 'PRINTING' | 'STICKERING' | 'COMPLETED' | 'CANCELLED';

export const OrderCategory = {
  SHOES: 'SHOES',
  TEXTILE: 'TEXTILE',
  MEDICINE: 'MEDICINE',
  WATER: 'WATER',
  TOBACCO: 'TOBACCO',
  BEER: 'BEER',
  OILS: 'OILS',
  DIETARY_SUPPLEMENTS: 'DIETARY_SUPPLEMENTS',
  JEWELRY: 'JEWELRY',
  SAIGA: 'SAIGA',
  OTHER: 'OTHER',
} as const;

export type OrderCategory = (typeof OrderCategory)[keyof typeof OrderCategory];
export type TariffType = 'DIGITAL' | 'PRINT' | 'STANDARD' | 'PRO';

export interface UserProfile {
  id: string;
  email: string;
  companyName: string;
  binIin: string;
  phone: string;
  role: 'CLIENT' | 'ADMIN';
  balance?: number;
  createdAt: string;
}

export interface OrderPositionItem {
  id?: string;
  orderId?: string;
  index: number;
  name: string;
  article?: string | null;
  size?: string | null;
  color?: string | null;
  gtin?: string | null;
  quantity: number;
  customData?: any;
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  userId: string;
  category: OrderCategory;
  tariffType: TariffType;
  itemsCount: number;
  pricePerItem: number;
  totalPrice: number;
  status: OrderStatus;
  extraServices: string[];
  ssccNeeded: boolean;
  pdfUrl?: string;
  codesFileUrl?: string;
  codesFileName?: string;
  stickerWidth?: number;
  stickerHeight?: number;
  stickerLayout?: any;
  stickerApprovalStatus?: string;
  stickerApprovalNotes?: string;
  stickerSentAt?: string;
  printAllowed?: boolean;
  paymentStatus?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  positions?: OrderPositionItem[];
  user?: {
    companyName: string;
    binIin: string;
    email: string;
    phone: string;
  };
}

export interface UserStickerTemplate {
  id: string;
  userId: string;
  name: string;
  category?: OrderCategory | null;
  widthMm: number;
  heightMm: number;
  elements: any[];
  previewUrl?: string | null;
  isPaid?: boolean;
  paidAt?: string | null;
  sourceOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

