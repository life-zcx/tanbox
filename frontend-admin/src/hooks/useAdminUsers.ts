import { useState, useEffect } from 'react';
import { UserClient } from '../types';
import { apiClient } from '../api/client';

export const useAdminUsers = () => {
  const [users, setUsers] = useState<UserClient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiClient.get('/users');
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading };
};
