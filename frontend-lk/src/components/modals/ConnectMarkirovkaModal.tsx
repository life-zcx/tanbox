import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Barcode,
  Globe,
  KeyRound,
  Check,
} from 'lucide-react';
import { apiClient } from '../../api/client';

interface ConnectMarkirovkaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account?: any) => void;
  initialAccount?: any;
}

export const ConnectMarkirovkaModal: React.FC<ConnectMarkirovkaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAccount,
}) => {
  const isDevOrTest = Boolean(
    Boolean(import.meta.env.DEV) ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('dev') ||
    window.location.hostname.includes('test') ||
    window.location.hostname.includes('stage') ||
    window.location.hostname.endsWith('.local')
  );

  const [name, setName] = useState(initialAccount?.name || '');
  const [login, setLogin] = useState(initialAccount?.login || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [environment, setEnvironment] = useState<'TEST' | 'PROD'>(
    initialAccount?.environment || (isDevOrTest ? 'TEST' : 'PROD')
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialAccount?.categories || []
  );

  // NKT (National Catalog) Fields
  const [nktApiKey, setNktApiKey] = useState(initialAccount?.nktApiKey || '');
  const [showNktApiKey, setShowNktApiKey] = useState(false);
  const [testingNkt, setTestingNkt] = useState(false);
  const [nktTestResult, setNktTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [testingMpt, setTestingMpt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mptTestResult, setMptTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialAccount) {
      setName(initialAccount.name || '');
      setLogin(initialAccount.login || '');
      setPassword('');
      setEnvironment(initialAccount.environment || (isDevOrTest ? 'TEST' : 'PROD'));
      setSelectedCategories(initialAccount.categories || []);
      setNktApiKey(initialAccount.nktApiKey || '');
    } else {
      setName('');
      setLogin('');
      setPassword('');
      setEnvironment(isDevOrTest ? 'TEST' : 'PROD');
      setSelectedCategories([]);
      setNktApiKey('');
    }
    setMptTestResult(null);
    setNktTestResult(null);
    setErrorMsg(null);
  }, [initialAccount, isOpen, isDevOrTest]);

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

  // Test IS MPT (markirovka.kz)
  const handleTestMptConnection = async () => {
    if (!initialAccount && (!login.trim() || !password.trim())) {
      setErrorMsg('Укажите логин и пароль для проверки соединения с ИС МПТ');
      return;
    }
    setErrorMsg(null);
    setTestingMpt(true);
    setMptTestResult(null);

    try {
      const testPayload: any = {
        environment,
        login: login.trim(),
      };
      if (password.trim()) {
        testPayload.password = password.trim();
      } else if (initialAccount?.id) {
        testPayload.id = initialAccount.id;
      }

      const res = await apiClient.post('/markirovka/test-connection', testPayload);

      if (res.data?.success) {
        setMptTestResult({
          success: true,
          message: res.data.message || 'Связь с ИС МПТ (Маркировка КЗ) подтверждена! Токен активен.',
        });
      } else {
        setMptTestResult({
          success: false,
          message: res.data?.message || 'Не удалось авторизоваться в ИС МПТ',
        });
      }
    } catch (err: any) {
      setMptTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Ошибка связи с сервером ИС МПТ',
      });
    } finally {
      setTestingMpt(false);
    }
  };

  // Test NKT (nationalcatalog.kz)
  const handleTestNktConnection = async () => {
    if (!nktApiKey.trim() && !initialAccount?.hasNktApiKey) {
      setErrorMsg('Укажите API-KEY для проверки связи с Национальным каталогом (НКТ)');
      return;
    }
    setErrorMsg(null);
    setTestingNkt(true);
    setNktTestResult(null);

    try {
      const testPayload: any = {
        serviceType: 'NKT',
        nktApiKey: nktApiKey.trim() || undefined,
      };
      if (initialAccount?.id) {
        testPayload.id = initialAccount.id;
      }

      const res = await apiClient.post('/markirovka/test-connection', testPayload);
      setNktTestResult({
        success: res.data?.success ?? true,
        message: res.data?.message || 'Связь с Национальным каталогом (НКТ) подтверждена! Ключ действителен.',
      });
    } catch (err: any) {
      setNktTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Ошибка проверки API-KEY Национального каталога',
      });
    } finally {
      setTestingNkt(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !login.trim()) {
      setErrorMsg('Пожалуйста, заполните название организации и логин');
      return;
    }

    if (!initialAccount && !password.trim()) {
      setErrorMsg('Пожалуйста, укажите пароль от личного кабинета ИС МПТ');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      if (initialAccount?.id) {
        const updatePayload: any = {
          name: name.trim(),
          login: login.trim(),
          environment,
          categories: selectedCategories,
          nktApiKey: nktApiKey.trim() || undefined,
        };
        if (password.trim()) {
          updatePayload.password = password.trim();
        }
        const res = await apiClient.put(`/markirovka/accounts/${initialAccount.id}`, updatePayload);
        onSuccess(res.data);
      } else {
        const res = await apiClient.post('/markirovka/accounts', {
          name: name.trim(),
          login: login.trim(),
          password: password.trim(),
          environment,
          categories: selectedCategories,
          nktApiKey: nktApiKey.trim() || undefined,
        });
        onSuccess(res.data);
      }
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
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-white to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#111827]">
                {initialAccount ? 'Настройка подключения (ИС МПТ и НКТ)' : 'Подключение организации (ИС МПТ и НКТ)'}
              </h3>
              <p className="text-xs text-[#64748B]">
                Интеграция с Markirovka.kz и NationalCatalog.kz (1 аккаунт на профиль)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1: General Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Название организации (Юрлицо / ИП) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Например: ТОО Ваша Компания или ИП Иванов"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#111827] focus:bg-white focus:border-[#0082FB] focus:outline-none transition-colors"
                required
              />
            </div>

            {isDevOrTest && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Контур интеграции
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEnvironment('PROD')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      environment === 'PROD'
                        ? 'bg-white text-[#111827] shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Боевой (markirovka.kz)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnvironment('TEST')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      environment === 'TEST'
                        ? 'bg-white text-[#111827] shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Тестовый (песочница)
                  </button>
                </div>
              </div>
            )}

            {/* Categories of Client */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Товарные группы аккаунта (специфика вашего бизнеса)
              </label>
              <p className="text-[11px] text-gray-400 mb-2">
                Выберите категории, с которыми работает ваша организация (будут предложены по умолчанию при создании карточек):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'SHOES', label: 'Обувь', icon: '👟' },
                  { id: 'TEXTILE', label: 'Легпром / Одежда', icon: '👕' },
                  { id: 'WATER', label: 'Вода и напитки', icon: '💧' },
                  { id: 'MEDICINE', label: 'Лекарства', icon: '💊' },
                  { id: 'TOBACCO', label: 'Табак', icon: '🚬' },
                  { id: 'BEER', label: 'Пиво / Напитки', icon: '🍺' },
                  { id: 'DIETARY_SUPPLEMENTS', label: 'БАДы', icon: '🌿' },
                  { id: 'OILS', label: 'Моторные масла', icon: '🛢️' },
                  { id: 'JEWELRY', label: 'Ювелирные изделия', icon: '💍' },
                  { id: 'SAIGA', label: 'Дериваты сайгака', icon: '🦌' },
                  { id: 'OTHER', label: 'Прочие товары', icon: '📦' },
                ].map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategories((prev) =>
                          isSelected ? prev.filter((c) => c !== cat.id) : [...prev, cat.id]
                        );
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0082FB]/10 border-[#0082FB] text-[#0082FB] font-semibold shadow-2xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      {isSelected && <span className="text-[10px] ml-0.5 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: Markirovka.kz (ИС МПТ) */}
          <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <Barcode className="w-4 h-4 text-[#0082FB]" />
                <span>1. Авторизация в Markirovka.kz (ИС МПТ)</span>
              </div>
              <button
                type="button"
                onClick={handleTestMptConnection}
                disabled={testingMpt || !login || (!initialAccount && !password)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-blue-50 text-[#0082FB] border border-blue-200 rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {testingMpt ? 'Проверка...' : 'Проверить ИС МПТ'}
              </button>
            </div>

            {mptTestResult && (
              <div className={`p-2.5 rounded-xl flex items-start gap-2 text-[11px] border ${
                mptTestResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {mptTestResult.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                )}
                <span>{mptTestResult.message}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Логин в Markirovka.kz (БИН / ИИН организации) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="12-значный БИН или логин ЛК"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-[#111827] font-mono focus:border-[#0082FB] focus:outline-none transition-colors"
                required
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Пароль от личного кабинета Markirovka.kz
                {initialAccount && <span className="font-normal text-gray-400 ml-1">(оставьте пустым, если не меняется)</span>}
                {!initialAccount && <span className="text-rose-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={initialAccount ? '••••••••••••' : 'Пароль от кабинета ИС МПТ'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-[#111827] focus:border-[#0082FB] focus:outline-none transition-colors"
                  required={!initialAccount}
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
            </div>
          </div>

          {/* SECTION 3: NationalCatalog.kz (НКТ) */}
          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>2. Авторизация в NationalCatalog.kz (НКТ)</span>
              </div>
              <button
                type="button"
                onClick={handleTestNktConnection}
                disabled={testingNkt || (!nktApiKey && !initialAccount?.hasNktApiKey)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {testingNkt ? 'Проверка...' : 'Проверить НКТ'}
              </button>
            </div>

            {nktTestResult && (
              <div className={`p-2.5 rounded-xl flex items-start gap-2 text-[11px] border ${
                nktTestResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {nktTestResult.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                )}
                <span>{nktTestResult.message}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                API-ключ Национального каталога товаров (X-API-KEY)
              </label>
              <div className="relative">
                <input
                  type={showNktApiKey ? 'text' : 'password'}
                  placeholder={
                    initialAccount?.hasNktApiKey
                      ? initialAccount.nktApiKey || '••••••••••••••••'
                      : 'Вставьте API-KEY из личного кабинета nationalcatalog.kz'
                  }
                  value={nktApiKey}
                  onChange={(e) => setNktApiKey(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-[#111827] font-mono focus:border-emerald-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNktApiKey(!showNktApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showNktApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
                Где взять: Личный кабинет <strong>nationalcatalog.kz</strong> → Настройки профиля → API ключи / Интеграция.
                Если у вас нет отдельного ключа, оставьте поле пустым — создание карточек будет идти через общий защищенный шлюз TANBOX.
              </p>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 font-semibold text-xs text-gray-700 transition-all cursor-pointer"
            >
              Отмена
            </button>

            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-5 rounded-xl bg-[#0082FB] hover:bg-[#0070DA] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{saving ? 'Сохранение...' : initialAccount ? 'Сохранить изменения' : 'Подключить аккаунт'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
