import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  AlertCircle,
  X,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

export const LoginPage: React.FC = () => {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [forgotLoading, setForgotLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Password validation & strength calculation (identical to RegisterPage.tsx)
  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-gray-200', textColor: '' };
    let points = 0;
    if (pwd.length >= 8) points += 1;
    if (pwd.length >= 10) points += 1;
    if (/\d/.test(pwd)) points += 1;
    if (/[a-zA-Zа-яА-ЯёЁ]/.test(pwd)) points += 1;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) points += 1;

    if (pwd.length < 8) {
      return { score: 1, label: 'Слабый (мин. 8 симв.)', color: 'bg-red-500', textColor: 'text-red-500' };
    }
    if (points <= 3) {
      return { score: 1, label: 'Слабый пароль', color: 'bg-red-500', textColor: 'text-red-500' };
    }
    if (points === 4) {
      return { score: 2, label: 'Средний пароль', color: 'bg-amber-500', textColor: 'text-amber-500' };
    }
    return { score: 3, label: 'Надежный пароль', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  const isPasswordMatch = Boolean(
    newPassword && confirmPassword && newPassword === confirmPassword
  );
  const isPasswordMismatch = Boolean(
    newPassword && confirmPassword && newPassword !== confirmPassword
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

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
        setError('Таймаут подключения. Попробуйте еще раз.');
      } else if (!err.response) {
        setError('Не удалось связаться с сервером. Проверьте интернет-соединение.');
      } else {
        setError(err.response?.data?.message || 'Ошибка авторизации');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Пожалуйста, укажите ваш e-mail');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) {
      setForgotError('Укажите корректный e-mail адрес');
      return;
    }

    setForgotLoading(true);
    setResending(true);
    setForgotError(null);
    setForgotSuccess(null);
    try {
      const res = await apiClient.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setForgotStep('OTP');
      setCooldown(res.data?.cooldownSeconds || 60);
      setForgotSuccess(res.data?.message || 'Код успешно отправлен на вашу почту');
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Ошибка при отправке кода сброса пароля');
    } finally {
      setForgotLoading(false);
      setResending(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (forgotCode.trim().length !== 6) {
      setForgotError('Введите 6-значный код подтверждения из письма');
      return;
    }

    if (newPassword.length < 8) {
      setForgotError('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (!/\d/.test(newPassword) || !/[a-zA-Zа-яА-ЯёЁ]/.test(newPassword)) {
      setForgotError('Пароль должен содержать и буквы, и цифры');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Введенные пароли не совпадают');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await apiClient.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        code: forgotCode.trim(),
        newPassword,
      });
      setForgotSuccess(res.data?.message || 'Пароль успешно изменен!');
      setEmail(forgotEmail.trim());
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('EMAIL');
        setForgotCode('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotSuccess(null);
      }, 2000);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Ошибка сброса пароля');
    } finally {
      setForgotLoading(false);
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
                placeholder="Введите e-mail"
                className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB] transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-extrabold text-[#111827] uppercase block">Пароль</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError(null);
                  setForgotSuccess(null);
                  setForgotStep('EMAIL');
                  setForgotCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowForgotModal(true);
                }}
                className="text-xs font-bold text-[#0082FB] hover:underline cursor-pointer"
              >
                Забыли пароль?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
              <input
                type={showLoginPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl pl-10 pr-10 py-3 text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-black transition-colors"
                tabIndex={-1}
                aria-label={showLoginPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-3.5 rounded-xl transition-all active:scale-95 shadow-md shadow-[#0082FB]/25 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Авторизация...' : 'Войти в кабинет'}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link to="/register" className="text-xs font-bold text-[#64748B] hover:text-[#0082FB] underline underline-offset-4">
            Нет аккаунта? Зарегистрировать компанию
          </Link>
        </div>

      </div>

      {/* Forgot Password Modal (Unified with RegisterPage design language) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-5 top-5 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with Official Logo */}
            <div className="text-center space-y-1">
              <img src="/tanbox-dark.svg" alt="tanbox" className="h-7 w-auto mx-auto mb-2" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                Восстановление пароля
              </h2>
              {forgotStep === 'EMAIL' ? (
                <p className="text-xs text-[#64748B]">
                  Укажите e-mail компании для получения 6-значного кода подтверждения
                </p>
              ) : (
                <>
                  <p className="text-xs text-[#64748B]">
                    Мы отправили 6-значный код сброса на e-mail:
                  </p>
                  <div className="text-xs font-bold text-[#111827] bg-[#F4F6F9] px-3 py-1 rounded-lg inline-block border border-gray-200/80 mt-0.5">
                    {forgotEmail}
                  </div>
                </>
              )}
            </div>

            {/* Success Message Banner */}
            {forgotSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-xs font-semibold text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* Error Message Banner */}
            {forgotError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2.5 text-xs font-semibold text-red-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 'EMAIL' ? (
              /* STEP 1: Enter Email */
              <form onSubmit={handleSendForgotCode} className="space-y-4 pt-1">
                <div>
                  <label className="text-[11px] font-extrabold text-[#111827] uppercase tracking-wider block mb-1">
                    E-mail адрес <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        setForgotError(null);
                      }}
                      placeholder="name@company.kz"
                      className="w-full bg-[#F4F6F9] border border-gray-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB] transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail.trim()}
                  className="w-full bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs sm:text-sm py-3 rounded-xl transition-all active:scale-95 shadow-md shadow-[#0082FB]/25 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Отправка кода...</span>
                    </>
                  ) : (
                    <>
                      <span>Отправить код подтверждения</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: Enter OTP + New Password with RegisterPage style validation */
              <form onSubmit={handleResetPassword} className="space-y-3.5 pt-1">
                {/* 1. OTP Code Input */}
                <div>
                  <label className="text-[11px] font-extrabold text-[#111827] uppercase tracking-wider block mb-1 text-center">
                    Код подтверждения (6 цифр) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative max-w-xs mx-auto">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                      maxLength={6}
                      value={forgotCode}
                      onChange={(e) => {
                        setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setForgotError(null);
                      }}
                      placeholder="••••••"
                      className="w-full text-center font-mono tracking-[0.4em] text-2xl font-bold text-[#111827] bg-[#F4F6F9] border border-gray-200/90 rounded-xl py-2 focus:outline-none focus:border-[#0082FB] transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-[#64748B] text-center mt-1">
                    Срок действия кода — 10 минут
                  </p>
                </div>

                {/* 2. New Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-extrabold text-[#111827] uppercase">
                      Новый пароль <span className="text-red-500">*</span>
                    </label>
                    {newPassword && (
                      <span className={`text-[10px] font-bold ${passwordStrength.textColor}`}>
                        {passwordStrength.label}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setForgotError(null);
                      }}
                      placeholder="Минимум 8 символов (буквы и цифры)"
                      className={`w-full bg-[#F4F6F9] border rounded-xl pl-9 pr-10 py-2.5 text-xs font-semibold text-[#111827] focus:outline-none transition-colors ${
                        newPassword.length > 0 && newPassword.length < 8
                          ? 'border-red-500 focus:border-red-500'
                          : newPassword.length >= 8
                          ? 'border-emerald-500 focus:border-emerald-500'
                          : 'border-gray-200/80 focus:border-[#0082FB]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-black transition-colors"
                      tabIndex={-1}
                      aria-label={showNewPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* 3-segment Strength Bar */}
                  {newPassword && (
                    <div className="mt-1.5 grid grid-cols-3 gap-1 h-1">
                      <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-gray-200'}`}></div>
                      <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-gray-200'}`}></div>
                      <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-gray-200'}`}></div>
                    </div>
                  )}
                </div>

                {/* 3. Confirm New Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-extrabold text-[#111827] uppercase">
                      Повторите новый пароль <span className="text-red-500">*</span>
                    </label>
                    {isPasswordMatch && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Совпадает
                      </span>
                    )}
                    {isPasswordMismatch && (
                      <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                        <XCircle className="w-3 h-3" /> Не совпадает
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setForgotError(null);
                      }}
                      placeholder="Введите пароль еще раз"
                      className={`w-full bg-[#F4F6F9] border rounded-xl pl-9 pr-10 py-2.5 text-xs font-semibold text-[#111827] focus:outline-none transition-colors ${
                        isPasswordMismatch
                          ? 'border-red-500 focus:border-red-500'
                          : isPasswordMatch
                          ? 'border-emerald-500 focus:border-emerald-500'
                          : 'border-gray-200/80 focus:border-[#0082FB]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-black transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Скрыть повтор пароля' : 'Показать повтор пароля'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Resend & Change Email Navigation */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    disabled={cooldown > 0 || resending}
                    onClick={() => handleSendForgotCode()}
                    className="font-bold text-[#0082FB] hover:underline disabled:text-gray-400 cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                    <span>
                      {cooldown > 0
                        ? `Отправить код повторно (${cooldown} сек)`
                        : 'Отправить код повторно'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('EMAIL');
                      setForgotError(null);
                      setForgotSuccess(null);
                    }}
                    className="text-gray-500 hover:text-black font-semibold cursor-pointer"
                  >
                    Изменить email
                  </button>
                </div>

                {/* Submit Reset Button */}
                <button
                  type="submit"
                  disabled={
                    forgotLoading ||
                    forgotCode.trim().length !== 6 ||
                    newPassword.length < 8 ||
                    newPassword !== confirmPassword
                  }
                  className="w-full bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs sm:text-sm py-3 rounded-xl transition-all active:scale-95 shadow-md shadow-[#0082FB]/25 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Сохранение нового пароля...</span>
                    </>
                  ) : (
                    <span>Установить новый пароль</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
