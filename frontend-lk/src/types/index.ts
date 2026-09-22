export type OrderStatus = 'NEW' | 'PROCESSING' | 'PRINTING' | 'STICKERING' | 'COMPLETED' | 'CANCELLED';
export type OrderCategory = 'SHOES' | 'TEXTILE' | 'MEDICINE' | 'WATER' | 'TOBACCO' | 'OTHER';
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
