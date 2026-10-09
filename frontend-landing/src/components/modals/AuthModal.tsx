import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Mail, Building2, Phone, Hash } from 'lucide-react';
import { getLkUrl } from '../../utils/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
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
      alert('Пожалуйста, подтвердите согласие на сбор и обработку персональных данных');
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
            {isLoginMode ? 'Добро пожаловать' : 'Регистрация компании tanbox'}
          </h3>
          <p className="text-xs text-gray-500">
            {isLoginMode
              ? 'Пожалуйста, введите ваши данные для входа в систему.'
              : 'Заполните данные вашей компании'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <>
              <div>
                <label className="text-xs font-bold text-black uppercase mb-1 block">Наименование ТОО / ИП</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder='ТОО "Казахстан Маркет"'
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-black uppercase mb-1 block">БИН / ИИН организации</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="980412354890"
                    value={formData.binIin}
                    onChange={(e) => setFormData({ ...formData, binIin: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-black uppercase mb-1 block">Телефон ответственного</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="+7 701 555 1234"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-black uppercase mb-1 block">Рабочий E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="info@company.kz"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-black uppercase mb-1 block">Пароль</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-black"
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
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
              />
              <span className="text-[11px] text-gray-500 leading-snug">
                Я соглашаюсь на{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-black font-semibold underline underline-offset-2 hover:opacity-75">
                  обработку персональных данных
                </a>{' '}
                и принимаю условия{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-black font-semibold underline underline-offset-2 hover:opacity-75">
                  публичной оферты
                </a>
              </span>
            </label>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white font-extrabold text-sm py-3.5 rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-md mt-2"
          >
            {isLoginMode ? 'Войти в личный кабинет lk.tanbox.kz' : 'Зарегистрировать компанию'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-2 border-t border-gray-100">
          <button
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-xs font-bold text-gray-600 hover:text-black underline underline-offset-4"
          >
            {isLoginMode
              ? 'У вас еще нет личного кабинета? Зарегистрироваться'
              : 'Уже есть аккаунт? Войти'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
