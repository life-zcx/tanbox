export type OrderStatus = 'NEW' | 'PROCESSING' | 'PRINTING' | 'STICKERING' | 'COMPLETED' | 'CANCELLED';
export type OrderCategory =
  | 'SHOES'
  | 'TEXTILE'
  | 'MEDICINE'
  | 'WATER'
  | 'TOBACCO'
  | 'BEER'
  | 'OILS'
  | 'DIETARY_SUPPLEMENTS'
  | 'JEWELRY'
  | 'SAIGA'
  | 'OTHER';
export type TariffType = 'DIGITAL' | 'PRINT' | 'STANDARD' | 'PRO';

export interface UserProfile {
  id: string;
  email: string;
  companyName: string;
  binIin: string;
  phone: string;
  role: 'CLIENT' | 'ADMIN';
  createdAt: string;
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
  sourceOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

