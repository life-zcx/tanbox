import { SessionRecovery } from '../../../shared/SessionRecovery';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: { email: string; password: string; companyName: string; binIin: string; phone: string; consent?: boolean; code?: string }) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [sessionError, setSessionError] = useState(false);
  const fetchMe = useCallback(async () => {
      setLoading(true);
      setSessionError(false);
      const token = localStorage.getItem('tanbox_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/auth/me');
        setUser(res.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('tanbox_token');
          setUser(null);
        } else {
          setSessionError(true);
        }
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => { void fetchMe(); }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('tanbox_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data: { email: string; password: string; companyName: string; binIin: string; phone: string }) => {
    const res = await apiClient.post('/auth/register', data);
    localStorage.setItem('tanbox_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('tanbox_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {sessionError ? <SessionRecovery retry={() => { void fetchMe(); }} loading={loading} /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
