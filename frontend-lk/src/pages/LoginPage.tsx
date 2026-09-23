import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('client@tanbox.kz');
  const [password, setPassword] = useState('client123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

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
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Таймаут подключения (10 сек). Бэкенд API недоступен на порту 5050.');
      } else if (!err.response) {
        setError('Не удалось связаться с сервером. Проверьте запуск контейнеров в Docker.');
      } else {
        setError(err.response?.data?.message || 'Ошибка авторизации');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4">
      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl max-w-md w-full p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <img src="/tanbox-dark.svg" alt="tanbox" className="h-8 w-auto mx-auto mb-2" />
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Добро пожаловать</h2>
          <p className="text-xs text-[#64748B]">Пожалуйста, введите ваши данные для входа в личный кабинет.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-extrabold text-[#111827] uppercase mb-1 block">E-mail адрес</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@tanbox.kz"
                className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-[#111827] uppercase mb-1 block">Пароль</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-3.5 rounded-xl transition-all active:scale-95 shadow-md shadow-[#0082FB]/25 disabled:opacity-50"
          >
            {loading ? 'Авторизация...' : 'Войти в кабинет'}
          </button>
        </form>

        <div className="bg-[#EBF5FF]/50 p-4 rounded-xl border border-[#0082FB]/10 text-xs text-[#475569] space-y-1">
          <p className="font-extrabold text-[#0082FB] uppercase">Тестовые данные для входа (DEV):</p>
          <p>E-mail: <code className="font-mono bg-white px-1.5 py-0.5 rounded font-bold text-[#111827]">client@tanbox.kz</code></p>
          <p>Пароль: <code className="font-mono bg-white px-1.5 py-0.5 rounded font-bold text-[#111827]">client123</code></p>
        </div>

        <div className="text-center pt-2">
          <Link to="/register" className="text-xs font-bold text-[#64748B] hover:text-[#0082FB] underline underline-offset-4">
            Нет аккаунта? Зарегистрировать компанию
          </Link>
        </div>

      </div>
    </div>
  );
};
