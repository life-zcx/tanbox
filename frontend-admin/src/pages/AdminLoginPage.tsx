import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ShieldCheck, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { useAdminAuth } from '../hooks/useAdminAuth';

export const AdminLoginPage: React.FC = () => {
  const { adminUser, loading: authLoading, loginAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && adminUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [adminUser, authLoading, navigate]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Focus OTP input when step changes
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

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

  // STEP 1: Submit email & password
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await loginAdmin(email, password);
      if (res?.requireOtp) {
        setStep('otp');
        setCooldown(res.cooldownRemaining || 60);
        setInfoMessage(res.message || `Код подтверждения отправлен на почту ${email}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Таймаут подключения (10 сек). Бэкенд API недоступен на порту 5050.');
      } else if (!err.response) {
        setError('Не удалось связаться с сервером. Проверьте запуск контейнеров в Docker.');
      } else {
        setError(err.response?.data?.message || err.message || 'Ошибка входа в админ-панель');
      }
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Submit 6-digit OTP code
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setError('Введите полный 6-значный код подтверждения из письма');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await loginAdmin(email, password, code.trim());
      if (res?.requireOtp) {
        // If still requiring code, update cooldown
        setCooldown(res.cooldownRemaining || 60);
        setError('Требуется подтвердить код');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Неверный код подтверждения');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP code
  const handleResendCode = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);

    try {
      const res = await loginAdmin(email, password);
      setCooldown(res?.cooldownRemaining || 60);
      setInfoMessage(`Новый код отправлен на почту ${email}`);
      setCode('');
      otpInputRef.current?.focus();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Не удалось повторно отправить код');
    } finally {
      setResending(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setCode('');
    setError(null);
    setInfoMessage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-xl max-w-md w-full p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <img src="/tanbox-dark.svg" alt="tanbox" className="h-8 w-auto mx-auto mb-2" />
          <h2 className="text-2xl font-black text-black tracking-tight">
            {step === 'credentials' ? 'Вход в систему' : 'Подтверждение входа'}
          </h2>
          <p className="text-xs text-gray-500">
            {step === 'credentials'
              ? 'Введите корпоративную почту и пароль для входа в систему.'
              : 'Одноразовый код отправлен на вашу почту:'}
          </p>
          {step === 'otp' && (
            <div className="inline-block bg-gray-100 text-black text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 tracking-wide mt-1">
              {email}
            </div>
          )}
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && !error && (
          <div className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-black" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* STEP 1 FORM: Credentials */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-extrabold text-black uppercase mb-1 block">Корпоративная почта</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@tanbox.kz"
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
                  autoComplete="current-password"
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
              {loading ? 'Проверка данных...' : 'Войти в систему'}
            </button>
          </form>
        )}

        {/* STEP 2 FORM: 6-digit OTP */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold text-black uppercase block">Одноразовый код</label>
                <span className="text-[11px] text-gray-400 font-semibold">6 цифр</span>
              </div>

              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(val);
                    if (error) setError(null);
                  }}
                  placeholder="123456"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-base tracking-[0.3em] font-mono font-bold text-black focus:outline-none focus:border-black placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-gray-400"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Код действителен в течение 10 минут.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.trim().length !== 6}
              className="w-full bg-black text-white font-extrabold text-sm py-3.5 rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-md disabled:opacity-50"
            >
              {loading ? 'Проверка кода...' : 'Подтвердить и войти'}
            </button>

            {/* Actions: Resend & Back */}
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={cooldown > 0 || resending}
                className="w-full text-xs font-bold text-gray-600 hover:text-black py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:hover:text-gray-600"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                {cooldown > 0
                  ? `Отправить повторно через ${cooldown} сек.`
                  : 'Отправить код повторно'}
              </button>

              <button
                type="button"
                onClick={handleBackToCredentials}
                className="w-full text-xs font-semibold text-gray-400 hover:text-black py-1 flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Изменить email или пароль
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
