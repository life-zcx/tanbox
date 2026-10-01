export type OrderStatus = 'NEW' | 'PROCESSING' | 'PRINTING' | 'STICKERING' | 'COMPLETED' | 'CANCELLED';
export type OrderCategory = string;

export interface UserClient {
  id: string;
  email: string;
  companyName: string;
  binIin: string;
  phone: string;
  role: 'CLIENT' | 'ADMIN';
  createdAt: string;
  _count?: {
    orders: number;
  };
}

export type AdminUser = UserClient;

export interface OrderAdminItem {
  id: string;
  orderNumber: string;
  userId: string;
  category: string;
  tariffType: string;
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
  notes?: string;
  createdAt: string;
  user?: {
    companyName: string;
    binIin: string;
    email: string;
    phone: string;
  };
}

export interface AdminMetrics {
  totalClients: number;
  totalOrders: number;
  activeOrders: number;
  totalItemsCodes: number;
  totalRevenue: number;
  estimatedProfitMargin: number;
}

export interface TariffItem {
  id: string;
  code: 'DIGITAL' | 'PRINT' | 'STANDARD' | 'PRO';
  name: string;
  description: string;
  fitFor: string;
  priceRetail: number;
  priceWholesale: number;
  priceLargeWholesale: number;
  costEstimate: number;
  priceMin: number;
  priceMax: number;
  marginEst: string;
}

export interface PricingSettingsItem {
  id?: string;
  key?: string;
  ssccPrice: number;
  stickerLayoutPrice: number;
  urgentPercent: number;
  expressDeliveryPrice: number;
  volumeTier1: number;
  volumeTier2: number;
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


