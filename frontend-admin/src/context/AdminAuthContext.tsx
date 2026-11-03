import { SessionRecovery } from '../../../shared/SessionRecovery';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserClient } from '../types';
import { apiClient } from '../api/client';

interface AdminAuthContextType {
  adminUser: UserClient | null;
  loading: boolean;
  loginAdmin: (email: string, password: string, code?: string) => Promise<any>;
  logoutAdmin: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<UserClient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [sessionError, setSessionError] = useState(false);
  const fetchMe = useCallback(async () => {
      setLoading(true);
      setSessionError(false);
      const token = localStorage.getItem('tanbox_admin_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/auth/me');
        if (res.data.role !== 'ADMIN') {
          localStorage.removeItem('tanbox_admin_token');
          setAdminUser(null);
        } else {
          setAdminUser(res.data);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('tanbox_admin_token');
          setAdminUser(null);
        } else {
          setSessionError(true);
        }
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => { void fetchMe(); }, [fetchMe]);

  const loginAdmin = async (email: string, password: string, code?: string) => {
    const res = await apiClient.post('/auth/login', { email, password, code, isAdminPanel: true });
    if (res.data.requireOtp) {
      return res.data;
    }
    if (res.data.user?.role !== 'ADMIN') {
      throw new Error('Учётная запись не имеет прав администратора');
    }
    localStorage.setItem('tanbox_admin_token', res.data.token);
    setAdminUser(res.data.user);
    return res.data;
  };

  const logoutAdmin = () => {
    localStorage.removeItem('tanbox_admin_token');
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, loading, loginAdmin, logoutAdmin }}>
      {sessionError ? <SessionRecovery retry={() => { void fetchMe(); }} loading={loading} /> : children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
