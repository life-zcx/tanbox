import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Barcode } from 'lucide-react';
import { apiClient } from '../../api/client';

interface ConnectMarkirovkaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: any) => void;
}

export const ConnectMarkirovkaModal: React.FC<ConnectMarkirovkaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [environment, setEnvironment] = useState<'TEST' | 'PROD'>('TEST');

  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!login.trim() || !password.trim()) {
      setErrorMsg('Укажите логин и пароль для проверки соединения');
      return;
    }
    setErrorMsg(null);
    setTesting(true);
    setTestResult(null);

    try {
      const res = await apiClient.post('/markirovka/test-connection', {
        environment,
        login: login.trim(),
        password: password.trim(),
      });

      if (res.data?.success) {
        setTestResult({
          success: true,
          message: res.data.message || 'Подключение успешно! Токен ИС МПТ получен.',
        });
      } else {
        setTestResult({
          success: false,
          message: res.data?.message || 'Не удалось авторизоваться в ИС МПТ',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Ошибка связи с сервером маркировки',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !login.trim() || !password.trim()) {
      setErrorMsg('Пожалуйста, заполните название, логин и пароль');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await apiClient.post('/markirovka/accounts', {
        name: name.trim(),
        login: login.trim(),
        password: password.trim(),
        environment,
      });

      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Ошибка сохранения аккаунта маркировки');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#111827]">Подключение Markirovka.kz</h3>
              <p className="text-xs text-[#64748B]">Прямая интеграция с личным кабинетом ИС МПТ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {testResult && (
            <div className={`p-3 rounded-xl flex items-start gap-2.5 text-xs border ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Название подключения
            </label>
            <input
              type="text"
              placeholder="Например: Основной аккаунт ТОО"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#111827] focus:bg-white focus:border-[#0082FB] focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Контур ИС МПТ
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setEnvironment('TEST')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  environment === 'TEST'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Тестовый (Песочница)
              </button>
              <button
                type="button"
                onClick={() => setEnvironment('PROD')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  environment === 'PROD'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Боевой (Прод)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Логин в Markirovka.kz (ИС МПТ)
            </label>
            <input
              type="text"
              placeholder="Логин от личного кабинета (ИНН/БИН или логин)"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#111827] font-mono focus:bg-white focus:border-[#0082FB] focus:outline-none transition-colors"
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Пароль от кабинета Markirovka.kz
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#111827] focus:bg-white focus:border-[#0082FB] focus:outline-none transition-colors"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              Пароль сохраняется в зашифрованном виде и используется исключительно для взаимодействия с API ИС МПТ.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !login || !password}
              className="py-2 px-3.5 rounded-xl border border-gray-300 hover:bg-gray-50 font-semibold text-xs text-gray-700 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Loader2 className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : 'hidden'}`} />
              <span>{testing ? 'Проверка...' : 'Проверить связь'}</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="py-2 px-4 rounded-xl bg-[#0082FB] hover:bg-[#0070DA] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{saving ? 'Сохранение...' : 'Сохранить аккаунт'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
