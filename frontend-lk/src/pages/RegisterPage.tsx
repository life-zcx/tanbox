import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Building2, Phone, Hash, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const RegisterPage: React.FC = () => {
  const { user, loading: authLoading, register } = useAuth();
  const navigate = useNavigate();

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
  const [form, setForm] = useState({
    email: '',
    password: '',
    companyName: '',
    binIin: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка регистрации организации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4">
      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl max-w-md w-full p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <img src="/tanbox-dark.svg" alt="tanbox" className="h-8 w-auto mx-auto mb-2" />
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Регистрация компании</h2>
          <p className="text-xs text-[#64748B]">Пожалуйста, введите данные вашей компании для создания аккаунта.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-extrabold text-[#111827] uppercase mb-1 block">Наименование ТОО / ИП</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder='ТОО "Казахстан Трейд"'
                className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-[#111827] uppercase mb-1 block">БИН / ИИН организации</label>
            <div className="relative">
              <Hash className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                maxLength={12}
                value={form.binIin}
                onChange={(e) => setForm({ ...form, binIin: e.target.value })}
                placeholder="980412354890"
                className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-[#111827] uppercase mb-1 block">Телефон ответственного</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+7 701 555 1234"
                className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-[#111827] uppercase mb-1 block">Рабочий E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="company@domain.kz"
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
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            {loading ? 'Создание аккаунта...' : 'Зарегистрировать компанию'}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs font-bold text-[#64748B] hover:text-[#0082FB] underline underline-offset-4">
            Уже есть аккаунт? Войти в кабинет
          </Link>
        </div>

      </div>
    </div>
  );
};
