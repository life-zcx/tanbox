import { useState, useEffect, useCallback } from 'react';
import { AdminAnalyticsData, AdminMetrics } from '../types';
import { apiClient } from '../api/client';

export const useAdminMetrics = (initialPeriod: string = '30d') => {
  const [period, setPeriod] = useState<string>(initialPeriod);
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { period };
      if (period === 'custom') {
        if (customFrom) params.from = customFrom;
        if (customTo) params.to = customTo;
      }
      const res = await apiClient.get('/metrics', { params });
      setAnalytics(res.data);
    } catch (err: any) {
      console.error('Failed to fetch analytics metrics:', err);
      setError(err.response?.data?.message || 'Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Backwards compatibility for components expecting basic metrics
  const metrics: AdminMetrics | null = analytics
    ? {
        totalClients: analytics.summary.totalClientsAllTime,
        totalOrders: analytics.summary.totalOrders,
        activeOrders: analytics.summary.activeOrders,
        totalItemsCodes: analytics.summary.totalItemsCodes,
        totalRevenue: analytics.summary.totalRevenue,
        estimatedProfitMargin: analytics.summary.estimatedProfitMargin,
      }
    : null;

  return {
    analytics,
    metrics,
    loading,
    error,
    period,
    setPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    refetch: fetchMetrics,
  };
};
