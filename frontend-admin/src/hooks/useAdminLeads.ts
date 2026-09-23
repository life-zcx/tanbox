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
    let localLeads: ServiceLeadItem[] = [];
    try {
      const saved = localStorage.getItem('tanbox_service_leads');
      if (saved) localLeads = JSON.parse(saved);
    } catch (e) {}

    try {
      const res = await apiClient.get('/leads/admin');
      const serverLeads: ServiceLeadItem[] = res.data;
      
      const mergedMap = new Map<string, ServiceLeadItem>();
      serverLeads.forEach((l) => mergedMap.set(l.id, l));
      localLeads.forEach((l) => {
        if (!mergedMap.has(l.id)) {
          mergedMap.set(l.id, l);
        }
      });

      const list = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLeads(list);
    } catch (err) {
      console.warn('Failed to fetch admin leads from server, using local leads:', err);
      const list = localLeads.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLeads(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminLeads();
  }, [fetchAdminLeads]);

  const updateLeadStatus = async (leadId: string, status: any) => {
    // 1. Update localStorage
    try {
      const saved: ServiceLeadItem[] = JSON.parse(localStorage.getItem('tanbox_service_leads') || '[]');
      const updated = saved.map((l) => (l.id === leadId ? { ...l, status } : l));
      localStorage.setItem('tanbox_service_leads', JSON.stringify(updated));
    } catch (e) {}

    // 2. Update server API
    try {
      await apiClient.patch(`/leads/admin/${leadId}`, { status });
    } catch (e) {
      console.warn('Failed to update lead status on server, updated locally:', e);
    }

    await fetchAdminLeads();
  };

  return { leads, loading, refetch: fetchAdminLeads, updateLeadStatus };
};
