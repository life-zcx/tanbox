import { useState, useEffect, useCallback } from 'react';
import { OrderItem } from '../types';
import { apiClient } from '../api/client';

export const useOrders = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/orders');
      setOrders(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = async (orderData: any) => {
    const res = await apiClient.post('/orders', orderData);
    await fetchOrders();
    return res.data;
  };

  return { orders, loading, error, refetch: fetchOrders, createOrder };
};
