import { useState, useEffect, useCallback } from 'react';
import { OrderAdminItem, OrderStatus } from '../types';
import { apiClient } from '../api/client';

export const useAdminOrders = () => {
  const [orders, setOrders] = useState<OrderAdminItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAdminOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminOrders();
  }, [fetchAdminOrders]);

  const updateStatus = async (orderId: string, status: OrderStatus, pdfUrl?: string) => {
    const res = await apiClient.patch(`/orders/${orderId}/status`, { status, pdfUrl });
    await fetchAdminOrders();
    return res.data;
  };

  return { orders, loading, refetch: fetchAdminOrders, updateStatus };
};
