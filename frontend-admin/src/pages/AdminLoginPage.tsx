import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../hooks/useAdminAuth';

export const AdminLoginPage: React.FC = () => {
  const { adminUser, loading: authLoading, loginAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@tanbox.kz');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && adminUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [adminUser, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <img src="/tanbox-dark.svg" alt="tanbox" className="h-8 w-auto animate-pulse" />
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginAdmin(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Таймаут подключения (10 сек). Бэкенд API недоступен на порту 5050.');
      } else if (!err.response) {
        setError('Не удалось связаться с сервером. Проверьте запуск контейнеров в Docker.');
      } else {
        setError(err.message || err.response?.data?.message || 'Ошибка входа в админ-панель');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-xl max-w-md w-full p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <img src="/tanbox-dark.svg" alt="tanbox" className="h-8 w-auto mx-auto mb-2" />
          <h2 className="text-2xl font-black text-black tracking-tight">Добро пожаловать</h2>
          <p className="text-xs text-gray-500">Пожалуйста, введите данные администратора для входа в систему.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-extrabold text-black uppercase mb-1 block">Email администратора</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tanbox.kz"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-black focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-black uppercase mb-1 block">Пароль</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-black focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-extrabold text-sm py-3.5 rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-md disabled:opacity-50"
          >
            {loading ? 'Авторизация...' : 'Войти в панель администратора'}
          </button>
        </form>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
          <p className="font-bold text-black uppercase">Учётные данные для теста (DEV):</p>
          <p>Email: <code className="font-mono bg-white px-1 font-bold text-black">admin@tanbox.kz</code></p>
          <p>Пароль: <code className="font-mono bg-white px-1 font-bold text-black">admin123</code></p>
        </div>

      </div>
    </div>
  );
};
