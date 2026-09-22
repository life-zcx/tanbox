import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserClient } from '../types';
import { apiClient } from '../api/client';

interface AdminAuthContextType {
  adminUser: UserClient | null;
  loading: boolean;
  loginAdmin: (email: string, password: string) => Promise<any>;
  logoutAdmin: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<UserClient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
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
      } catch (err) {
        localStorage.removeItem('tanbox_admin_token');
        setAdminUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const loginAdmin = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data.user.role !== 'ADMIN') {
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
      {children}
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
