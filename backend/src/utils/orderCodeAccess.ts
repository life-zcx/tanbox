import { Order, Prisma } from '@prisma/client';

export type CodeAccessUser = { id: string; role: string };
export type OrderCodeAccess = Pick<Order, 'userId' | 'status' | 'paymentStatus' | 'printAllowed'>;

export const orderCodeAccessSelect = {
  userId: true, status: true, paymentStatus: true, printAllowed: true,
  extraServices: true, notes: true, stickerApprovalStatus: true,
} satisfies Prisma.OrderSelect;

export function canAccessOrderCodes(order: OrderCodeAccess | null | undefined, user: CodeAccessUser | undefined): boolean {
  if (!user || !order) return false;
  if (user.role === 'ADMIN') return true;
  return order.userId === user.id && order.status !== 'CANCELLED' && order.paymentStatus !== 'REFUNDED'
    && (order.paymentStatus === 'PAID' || order.printAllowed === true);
}

// Keep database filtering equivalent to canAccessOrderCodes for a client.
export function clientOrderCodeAccessWhere(userId: string): Prisma.OrderWhereInput {
  return {
    userId,
    status: { not: 'CANCELLED' },
    paymentStatus: { not: 'REFUNDED' },
    OR: [{ paymentStatus: 'PAID' }, { printAllowed: true }],
  };
}

type PrintableOrder = OrderCodeAccess & Partial<Pick<Order, 'extraServices' | 'notes' | 'stickerApprovalStatus'>>;

export function orderPrintAccessError(order: PrintableOrder, user: CodeAccessUser, calibrationSample = false): string | null {
  if (user.role === 'ADMIN') return null;
  if (order.userId !== user.id) return 'Нет доступа к данному заказу';
  if (order.status === 'CANCELLED' || order.paymentStatus === 'REFUNDED') {
    return 'Печать отменённого заказа или заказа с возвратом оплаты недоступна.';
  }
  // Callers must restrict this exception to the first label, never a batch or arbitrary index.
  if (calibrationSample) return null;
  if (!canAccessOrderCodes(order, user)) {
    return 'Доступ к кодам и печати заблокирован: ожидается оплата или разрешение администратора.';
  }
  const customDesign = order.extraServices?.includes('STICKER_LAYOUT_DESIGN')
    || /Разработка макета|STICKER_LAYOUT_DESIGN/i.test(order.notes || '');
  if (customDesign && order.stickerApprovalStatus !== 'APPROVED') {
    return 'Печать заблокирована: индивидуальный макет этикетки ещё не согласован.';
  }
  return null;
}

type OrderWithCodeData = OrderCodeAccess & {
  id: string;
  codesFileUrl?: string | null;
  pdfUrl?: string | null;
  markirovkaOrders?: Array<{ codes?: unknown; errorDetails?: string | null }>;
  markirovkaReports?: Array<{ id?: string; reportData?: unknown; errorDetails?: string | null }>;
};

// Status/count metadata remains visible before payment; raw codes and integration payloads do not.
export function orderWithCodeAccess<T extends OrderWithCodeData>(order: T, user: CodeAccessUser): T;
export function orderWithCodeAccess<T extends OrderWithCodeData>(order: T | null, user: CodeAccessUser): T | null;
export function orderWithCodeAccess<T extends OrderWithCodeData>(order: T | null, user: CodeAccessUser): T | null {
  if (!order || canAccessOrderCodes(order, user)) return order;
  return {
    ...order,
    // Keep file availability visible in the UI, but expose only endpoints that recheck access.
    codesFileUrl: order.codesFileUrl ? `/api/orders/${encodeURIComponent(order.id)}/codes-file` : null,
    pdfUrl: order.pdfUrl ? `/api/orders/${encodeURIComponent(order.id)}/pdf` : null,
    ...(order.markirovkaOrders && {
      markirovkaOrders: order.markirovkaOrders.map(item => ({ ...item, codes: null, errorDetails: null })),
    }),
    ...(order.markirovkaReports && {
      markirovkaReports: order.markirovkaReports.map(item => ({ ...item, reportData: null, errorDetails: null })),
    }),
  };
}
