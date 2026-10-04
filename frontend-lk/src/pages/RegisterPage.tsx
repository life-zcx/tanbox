import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Building2, Phone, Hash, AlertCircle, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const RegisterPage: React.FC = () => {
  const { user, loading: authLoading, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [form, setForm] = useState({
    companyName: '',
    binIin: '',
    phone: '',
    email: '',
    password: '',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [consent, setConsent] = useState(false);

  // Field validation errors
  const [errors, setErrors] = useState<{
    companyName?: string;
    binIin?: string;
    phone?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    consent?: boolean;
  }>({});

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  // --- Phone Mask Helper for Kazakhstan ---
  const formatPhoneNumber = (val: string): string => {
    let digits = val.replace(/\D/g, '');
    if (digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    }
    if (!digits.startsWith('7') && digits.length > 0) {
      digits = '7' + digits;
    }
    digits = digits.slice(0, 11);

    if (digits.length === 0) return '';
    if (digits.length <= 1) return '+7';
    if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
    if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  // --- Password Strength Calculator ---
  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-gray-200', textColor: 'text-gray-400' };
    
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

  const passwordStrength = calculatePasswordStrength(form.password);

  // --- Individual Field Validators ---
  const validateCompanyName = (val: string): boolean => {
    if (!val.trim()) {
      setErrors((prev) => ({ ...prev, companyName: 'Укажите наименование компании' }));
      return false;
    }
    if (val.trim().length < 2) {
      setErrors((prev) => ({ ...prev, companyName: 'Минимум 2 символа' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, companyName: undefined }));
    return true;
  };

  const validateBinIin = (val: string): boolean => {
    const digits = val.replace(/\D/g, '');
    if (!val.trim()) {
      setErrors((prev) => ({ ...prev, binIin: 'Укажите 12-значный БИН / ИИН' }));
      return false;
    }
    if (digits.length !== 12 || val.trim().length !== 12) {
      setErrors((prev) => ({ ...prev, binIin: 'Должно быть ровно 12 цифр' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, binIin: undefined }));
    return true;
  };

  const validatePhone = (val: string): boolean => {
    const digits = val.replace(/\D/g, '');
    if (!val.trim()) {
      setErrors((prev) => ({ ...prev, phone: 'Укажите номер телефона' }));
      return false;
    }
    if (digits.length !== 11) {
      setErrors((prev) => ({ ...prev, phone: 'Номер должен содержать 11 цифр' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, phone: undefined }));
    return true;
  };

  const validateEmail = (val: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.trim()) {
      setErrors((prev) => ({ ...prev, email: 'Укажите рабочий e-mail' }));
      return false;
    }
    if (!emailRegex.test(val.trim())) {
      setErrors((prev) => ({ ...prev, email: 'Некорректный e-mail' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, email: undefined }));
    return true;
  };

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setErrors((prev) => ({ ...prev, password: 'Придумайте пароль' }));
      return false;
    }
    if (val.length < 8) {
      setErrors((prev) => ({ ...prev, password: 'Минимум 8 символов' }));
      return false;
    }
    if (!/\d/.test(val) || !/[a-zA-Zа-яА-ЯёЁ]/.test(val)) {
      setErrors((prev) => ({ ...prev, password: 'Нужны и буквы, и цифры' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, password: undefined }));
    return true;
  };

  const validateConfirmPassword = (val: string, originalPassword = form.password): boolean => {
    if (!val) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Повторите пароль' }));
      return false;
    }
    if (val !== originalPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Пароли не совпадают' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    return true;
  };

  // --- Form Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const isCompanyValid = validateCompanyName(form.companyName);
    const isBinValid = validateBinIin(form.binIin);
    const isPhoneValid = validatePhone(form.phone);
    const isEmailValid = validateEmail(form.email);
    const isPasswordValid = validatePassword(form.password);
    const isConfirmValid = validateConfirmPassword(confirmPassword, form.password);

    let hasError = false;
    if (!consent) {
      setErrors((prev) => ({ ...prev, consent: true }));
      hasError = true;
    }

    if (!isCompanyValid || !isBinValid || !isPhoneValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    try {
      await register({
        companyName: form.companyName.trim(),
        binIin: form.binIin.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        consent: true,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setGeneralError(err.response?.data?.message || 'Ошибка регистрации организации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl max-w-2xl w-full p-5 sm:p-7 space-y-4">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <img src="/tanbox-dark.svg" alt="tanbox" className="h-7 w-auto mx-auto mb-1" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">Регистрация компании</h2>
          <p className="text-xs text-[#64748B]">Введите данные вашей организации для создания аккаунта</p>
        </div>

        {/* General Error Alert */}
        {generalError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-2.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          
          {/* 2-Column Grid for fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">

            {/* 1. Company Name */}
            <div>
              <label className="text-[11px] font-extrabold text-[#111827] uppercase mb-1 block">
                Наименование ТОО / ИП <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) => {
                    setForm({ ...form, companyName: e.target.value });
                    if (errors.companyName) validateCompanyName(e.target.value);
                  }}
                  onBlur={(e) => validateCompanyName(e.target.value)}
                  placeholder='ТОО "Казахстан Трейд"'
                  className={`w-full bg-[#F4F6F9] border rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-[#111827] focus:outline-none transition-colors ${
                    errors.companyName ? 'border-red-500 focus:border-red-500' : 'border-gray-200/80 focus:border-[#0082FB]'
                  }`}
                />
              </div>
              {errors.companyName && <p className="text-red-500 text-[10px] font-medium mt-1">{errors.companyName}</p>}
            </div>

            {/* 2. BIN / IIN */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-extrabold text-[#111827] uppercase">
                  БИН / ИИН (12 цифр) <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-medium text-[#64748B]">
                  {form.binIin.length}/12
                </span>
              </div>
              <div className="relative">
                <Hash className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={12}
                  value={form.binIin}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setForm({ ...form, binIin: cleaned });
                    if (errors.binIin) validateBinIin(cleaned);
                  }}
                  onBlur={(e) => validateBinIin(e.target.value)}
                  placeholder="980412354890"
                  className={`w-full bg-[#F4F6F9] border rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-[#111827] focus:outline-none transition-colors ${
                    errors.binIin ? 'border-red-500 focus:border-red-500' : 'border-gray-200/80 focus:border-[#0082FB]'
                  }`}
                />
              </div>
              {errors.binIin && <p className="text-red-500 text-[10px] font-medium mt-1">{errors.binIin}</p>}
            </div>

            {/* 3. Phone */}
            <div>
              <label className="text-[11px] font-extrabold text-[#111827] uppercase mb-1 block">
                Телефон ответственного <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onFocus={() => {
                    if (!form.phone) {
                      setForm({ ...form, phone: '+7 (' });
                    }
                  }}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setForm({ ...form, phone: formatted });
                    if (errors.phone) validatePhone(formatted);
                  }}
                  onBlur={(e) => validatePhone(e.target.value)}
                  placeholder="+7 (701) 555-12-34"
                  className={`w-full bg-[#F4F6F9] border rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-[#111827] focus:outline-none transition-colors ${
                    errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200/80 focus:border-[#0082FB]'
                  }`}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-[10px] font-medium mt-1">{errors.phone}</p>}
            </div>

            {/* 4. Work E-mail */}
            <div>
              <label className="text-[11px] font-extrabold text-[#111827] uppercase mb-1 block">
                Рабочий E-mail <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (errors.email) validateEmail(e.target.value);
                  }}
                  onBlur={(e) => validateEmail(e.target.value)}
                  placeholder="company@domain.kz"
                  className={`w-full bg-[#F4F6F9] border rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-[#111827] focus:outline-none transition-colors ${
                    errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200/80 focus:border-[#0082FB]'
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-[10px] font-medium mt-1">{errors.email}</p>}
            </div>

            {/* 5. Password with Strength Bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-extrabold text-[#111827] uppercase">
                  Пароль <span className="text-red-500">*</span>
                </label>
                {passwordStrength.label && (
                  <span className={`text-[10px] font-bold ${passwordStrength.textColor}`}>
                    {passwordStrength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, password: val });
                    if (errors.password) validatePassword(val);
                    if (confirmPassword) validateConfirmPassword(confirmPassword, val);
                  }}
                  onBlur={(e) => validatePassword(e.target.value)}
                  placeholder="Мин. 8 знаков (буквы + цифры)"
                  className={`w-full bg-[#F4F6F9] border rounded-xl pl-9 pr-10 py-2.5 text-xs font-semibold text-[#111827] focus:outline-none transition-colors ${
                    errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-200/80 focus:border-[#0082FB]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-black transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Password Strength Progress Bar (3 segments) */}
              {form.password && (
                <div className="mt-1.5 grid grid-cols-3 gap-1 h-1">
                  <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-gray-200'}`}></div>
                  <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-gray-200'}`}></div>
                  <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-gray-200'}`}></div>
                </div>
              )}

              {errors.password && <p className="text-red-500 text-[10px] font-medium mt-1">{errors.password}</p>}
            </div>

            {/* 6. Confirm Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-extrabold text-[#111827] uppercase">
                  Повторите пароль <span className="text-red-500">*</span>
                </label>
                {confirmPassword && confirmPassword === form.password && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Совпадает
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
                    const val = e.target.value;
                    setConfirmPassword(val);
                    validateConfirmPassword(val);
                  }}
                  onBlur={(e) => validateConfirmPassword(e.target.value)}
                  placeholder="Введите пароль еще раз"
                  className={`w-full bg-[#F4F6F9] border rounded-xl pl-9 pr-10 py-2.5 text-xs font-semibold text-[#111827] focus:outline-none transition-colors ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:border-red-500'
                      : confirmPassword && confirmPassword === form.password
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

              {errors.confirmPassword && (
                <p className="text-red-500 text-[10px] font-medium mt-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3 shrink-0" /> {errors.confirmPassword}
                </p>
              )}
            </div>

          </div>

          {/* Personal Data Consent Checkbox (Закон РК № 94-V) */}
          <div
            className={`flex items-start gap-2 pt-1 p-2 rounded-xl transition-all ${
              errors.consent
                ? 'bg-red-50/80 border border-red-300 ring-1 ring-red-200'
                : 'border border-transparent'
            }`}
          >
            <input
              type="checkbox"
              id="register-consent"
              required
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) {
                  setErrors((prev) => ({ ...prev, consent: false }));
                }
              }}
              className={`mt-0.5 h-4 w-4 rounded cursor-pointer shrink-0 transition-colors ${
                errors.consent
                  ? 'border-red-500 text-red-600 focus:ring-red-400'
                  : 'border-gray-300 text-[#0082FB] focus:ring-[#0082FB]'
              }`}
            />
            <label
              htmlFor="register-consent"
              className={`text-[11px] leading-tight cursor-pointer select-none transition-colors ${
                errors.consent ? 'text-red-700 font-semibold' : 'text-[#64748B]'
              }`}
            >
              Я подтверждаю достоверность данных и даю согласие на сбор и обработку ПД согласно{' '}
              <a
                href={
                  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? `${window.location.protocol}//${window.location.hostname}:3000/privacy`
                    : `${window.location.protocol}//${window.location.hostname.replace(/^(lk|admin)\./, '')}/privacy`
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`font-semibold underline underline-offset-2 ${
                  errors.consent ? 'text-red-800' : 'text-[#0082FB]'
                }`}
              >
                Политике конфиденциальности РК
              </a>{' '}
              и{' '}
              <a
                href={
                  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? `${window.location.protocol}//${window.location.hostname}:3000/terms`
                    : `${window.location.protocol}//${window.location.hostname.replace(/^(lk|admin)\./, '')}/terms`
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`font-semibold underline underline-offset-2 ${
                  errors.consent ? 'text-red-800' : 'text-[#0082FB]'
                }`}
              >
                Публичной оферте
              </a>.
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs sm:text-sm py-3 rounded-xl transition-all active:scale-95 shadow-md shadow-[#0082FB]/25 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Создание аккаунта...' : 'Зарегистрировать компанию'}
          </button>
        </form>

        <div className="text-center pt-1">
          <Link to="/login" className="text-xs font-bold text-[#64748B] hover:text-[#0082FB] underline underline-offset-4">
            Уже есть аккаунт? Войти в кабинет
          </Link>
        </div>

      </div>
    </div>
  );
};
