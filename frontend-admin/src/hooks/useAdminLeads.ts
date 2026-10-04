import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';

export interface ServiceLeadItem {
  id: string;
  serviceTitle: string;
  companyName: string;
  phone: string;
  email?: string;
  binIin?: string;
  notes?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export const useAdminLeads = () => {
  const [leads, setLeads] = useState<ServiceLeadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAdminLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/leads/admin');
      const serverLeads: ServiceLeadItem[] = res.data;
      const list = serverLeads.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLeads(list);
    } catch (err) {
      console.error('Failed to fetch admin leads from server:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminLeads();
  }, [fetchAdminLeads]);

  const updateLeadStatus = async (leadId: string, status: any) => {
    await apiClient.patch(`/leads/admin/${leadId}`, { status });
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );
  };

  return { leads, loading, refetch: fetchAdminLeads, updateLeadStatus };
};
