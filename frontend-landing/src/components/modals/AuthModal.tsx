import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, Lock, Mail, Building2, Phone, Hash } from 'lucide-react';
import { getLkUrl } from '../../utils/navigation';
import { useLanguage } from '../../context/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { lang, getLocalizedPath } = useLanguage();
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    binIin: '',
    phone: '',
  });
  const [agreePolicy, setAgreePolicy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoginMode && !agreePolicy) {
      alert(
        lang === 'kz'
          ? 'Дербес деректерді жинауға және өңдеуге келісіміңізді растаңыз'
          : lang === 'en'
          ? 'Please confirm consent to personal data collection and processing'
          : 'Пожалуйста, подтвердите согласие на сбор и обработку персональных данных'
      );
      return;
    }
    // Redirect to client cabinet auth endpoint
    window.location.href = getLkUrl(`/${isLoginMode ? 'login' : 'register'}`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full p-8 relative space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center">
          <img src="/tanbox-dark.svg" alt="tanbox" className="h-8 w-auto mx-auto mb-2" />
          <h3 className="text-2xl font-black text-black tracking-tight">
            {isLoginMode
              ? lang === 'kz'
                ? 'Қош келдіңіз'
                : lang === 'en'
                ? 'Welcome'
                : 'Добро пожаловать'
              : lang === 'kz'
              ? 'Компанияны тіркеу'
              : lang === 'en'
              ? 'Register Company'
              : 'Регистрация компании'}
          </h3>
          <p className="text-xs text-gray-500">
            {isLoginMode
              ? lang === 'kz'
                ? 'Жүйеге кіру үшін деректеріңізді енгізіңіз.'
                : lang === 'en'
                ? 'Please enter your login credentials.'
                : 'Пожалуйста, введите ваши данные для входа в систему.'
              : lang === 'kz'
              ? 'Компанияңыздың деректерін толтырыңыз'
              : lang === 'en'
              ? 'Fill in your company details'
              : 'Заполните данные вашей компании'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <>
              <div>
                <label className="text-xs font-bold text-black uppercase mb-1 block">
                  {lang === 'kz' ? 'ЖШС / ЖК атауы' : lang === 'en' ? 'Company Name / Sole Proprietor' : 'Наименование ТОО / ИП'}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder={lang === 'kz' ? '"Қазақстан Маркет" ЖШС' : lang === 'en' ? '"Kazakhstan Market" LLP' : 'ТОО "Казахстан Маркет"'}
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-[#0082FB]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-black uppercase mb-1 block">
                  {lang === 'kz' ? 'Ұйымның БСН / ЖСН' : lang === 'en' ? 'Organization BIN / IIN' : 'БИН / ИИН организации'}
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="980412354890"
                    value={formData.binIin}
                    onChange={(e) => setFormData({ ...formData, binIin: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-[#0082FB]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-black uppercase mb-1 block">
                  {lang === 'kz' ? 'Жауапты тұлғаның телефоны' : lang === 'en' ? 'Contact Phone' : 'Телефон ответственного'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="+7 701 555 1234"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-[#0082FB]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-black uppercase mb-1 block">
              {lang === 'kz' ? 'Жұмыс E-mail' : lang === 'en' ? 'Work E-mail' : 'Рабочий E-mail'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="info@company.kz"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-[#0082FB]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-black uppercase mb-1 block">
              {lang === 'kz' ? 'Құпия сөз' : lang === 'en' ? 'Password' : 'Пароль'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-[#0082FB]"
              />
            </div>
          </div>

          {!isLoginMode && (
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={agreePolicy}
                onChange={(e) => setAgreePolicy(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#0082FB] focus:ring-[#0082FB] cursor-pointer"
              />
              <span className="text-[11px] text-gray-500 leading-snug">
                {lang === 'kz' ? (
                  <>
                    Мен{' '}
                    <Link to={getLocalizedPath('/privacy')} target="_blank" className="text-[#0082FB] font-semibold underline underline-offset-2">
                      дербес деректерді өңдеуге
                    </Link>{' '}
                    келісемін және{' '}
                    <Link to={getLocalizedPath('/terms')} target="_blank" className="text-[#0082FB] font-semibold underline underline-offset-2">
                      жария оферта
                    </Link>{' '}
                    талаптарын қабылдаймын.
                  </>
                ) : lang === 'en' ? (
                  <>
                    I agree to{' '}
                    <Link to={getLocalizedPath('/privacy')} target="_blank" className="text-[#0082FB] font-semibold underline underline-offset-2">
                      personal data processing
                    </Link>{' '}
                    and accept the{' '}
                    <Link to={getLocalizedPath('/terms')} target="_blank" className="text-[#0082FB] font-semibold underline underline-offset-2">
                      public offer
                    </Link>{' '}
                    terms.
                  </>
                ) : (
                  <>
                    Я соглашаюсь на{' '}
                    <Link to={getLocalizedPath('/privacy')} target="_blank" className="text-[#0082FB] font-semibold underline underline-offset-2">
                      обработку персональных данных
                    </Link>{' '}
                    и принимаю условия{' '}
                    <Link to={getLocalizedPath('/terms')} target="_blank" className="text-[#0082FB] font-semibold underline underline-offset-2">
                      публичной оферты
                    </Link>
                  </>
                )}
              </span>
            </label>
          )}

          <button
            type="submit"
            className="w-full bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-3.5 rounded-xl transition-all active:scale-95 shadow-md mt-2 cursor-pointer"
          >
            {isLoginMode
              ? lang === 'kz'
                ? 'lk.tanbox.kz жеке кабинетіне кіру'
                : lang === 'en'
                ? 'Log in to lk.tanbox.kz'
                : 'Войти в личный кабинет lk.tanbox.kz'
              : lang === 'kz'
              ? 'Компанияны тіркеу'
              : lang === 'en'
              ? 'Register Company'
              : 'Зарегистрировать компанию'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-2 border-t border-gray-100">
          <button
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-xs font-bold text-gray-600 hover:text-[#0082FB] underline underline-offset-4 cursor-pointer"
          >
            {isLoginMode
              ? lang === 'kz'
                ? 'Жеке кабинетіңіз әлі жоқ па? Тіркелу'
                : lang === 'en'
                ? 'No account yet? Register'
                : 'У вас еще нет личного кабинета? Зарегистрироваться'
              : lang === 'kz'
              ? 'Аккаунтыңыз бар ма? Кіру'
              : lang === 'en'
              ? 'Already registered? Log in'
              : 'Уже есть аккаунт? Войти'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default AuthModal;
