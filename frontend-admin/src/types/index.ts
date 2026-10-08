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
    stickerTemplates?: number;
  };
}

export interface UserOrderBrief {
  id: string;
  orderNumber: string;
  category: string;
  tariffType: string;
  itemsCount: number;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus?: string;
  printAllowed?: boolean;
  createdAt: string;
}

export interface UserTemplateBrief {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  category?: string;
  elements?: any[];
  previewUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserDetail extends UserClient {
  updatedAt?: string;
  orders: UserOrderBrief[];
  stickerTemplates: UserTemplateBrief[];
  totalSpent: number;
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
  printAllowed?: boolean;
  paymentStatus?: string;
  notes?: string;
  createdAt: string;
  user?: {
    companyName: string;
    binIin: string;
    email: string;
    phone: string;
  };
  markirovkaOrders?: {
    id: string;
    accountId: string;
    status: 'PENDING' | 'READY' | 'FETCHING' | 'COMPLETED' | 'FAILED';
    gtin: string;
    quantityRequested: number;
    quantityReceived: number;
    externalOrderId?: string | null;
    errorDetails?: string | null;
    codes?: string[];
    createdAt: string;
    account?: {
      id: string;
      name: string;
      environment: 'TEST' | 'PROD';
      login: string;
    };
  }[];
  markirovkaReports?: {
    id: string;
    accountId: string;
    status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
    codesCount: number;
    externalReportId?: string | null;
    errorDetails?: string | null;
    submittedAt?: string | null;
    createdAt: string;
  }[];
  _count?: {
    codeItems?: number;
  };
}

export interface DailyTimelinePoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  codes: number;
}

export interface TariffDistributionItem {
  key: string;
  name: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface CategoryDistributionItem {
  key: string;
  name: string;
  count: number;
  codes: number;
  revenue: number;
  percentage: number;
}

export interface StatusFunnelItem {
  key: string;
  name: string;
  count: number;
  revenue: number;
}

export interface TopClientMetric {
  userId: string;
  companyName: string;
  binIin: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalRevenue: number;
  totalCodes: number;
}

export interface AdminAnalyticsData {
  period: string;
  startDate: string;
  endDate: string;
  summary: {
    totalRevenue: number;
    estimatedProfitMargin: number;
    paidRevenue: number;
    unpaidRevenue: number;
    averageOrderValue: number;
    averageItemsPerOrder: number;
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    completionRate: number;
    totalItemsCodes: number;
    newClientsCount: number;
    totalClientsAllTime: number;
  };
  growth: {
    revenue: number;
    orders: number;
    codes: number;
    clients: number;
  };
  dailyTimeline: DailyTimelinePoint[];
  tariffDistribution: TariffDistributionItem[];
  categoryDistribution: CategoryDistributionItem[];
  statusFunnel: StatusFunnelItem[];
  topClients: TopClientMetric[];
  leads: {
    total: number;
    completed: number;
    conversionRate: number;
    growth: number;
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


