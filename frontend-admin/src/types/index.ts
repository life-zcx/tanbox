export type OrderStatus = 'NEW' | 'PROCESSING' | 'PRINTING' | 'STICKERING' | 'COMPLETED' | 'CANCELLED';

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
