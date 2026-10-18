import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Barcode,
  Globe,
  KeyRound,
  Building2,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export type MarkirovkaTargetService = 'MPT' | 'NKT' | 'ALL';

interface ConnectMarkirovkaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account?: any) => void;
  initialAccount?: any;
  targetService?: MarkirovkaTargetService;
}

export const ConnectMarkirovkaModal: React.FC<ConnectMarkirovkaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAccount,
  targetService = 'ALL',
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const isDevOrTest = Boolean(
    Boolean(import.meta.env.DEV) ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('dev') ||
    window.location.hostname.includes('test') ||
    window.location.hostname.includes('stage') ||
    window.location.hostname.endsWith('.local')
  );

  // In production, regular clients should NEVER see test mode - only admins can.
  // In dev/local, developers and admins can see test mode.
  const isProd = !isDevOrTest;
  const canSelectEnvironment = isAdmin || !isProd;

  const isNktOnly = targetService === 'NKT';
  const isMptOnly = targetService === 'MPT';

  const [name, setName] = useState(initialAccount?.name || '');
  const [login, setLogin] = useState(initialAccount?.login || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [environment, setEnvironment] = useState<'TEST' | 'PROD'>(
    canSelectEnvironment ? (initialAccount?.environment || (isDevOrTest ? 'TEST' : 'PROD')) : 'PROD'
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialAccount?.categories || []
  );

  // NKT (National Catalog) Fields
  const [nktApiKey, setNktApiKey] = useState('');
  const [nktEnvironment, setNktEnvironment] = useState<'PROD' | 'TEST'>(
    canSelectEnvironment && (initialAccount?.nktBaseUrl?.includes('developer') || initialAccount?.nktBaseUrl?.includes('test') || initialAccount?.nktBaseUrl?.includes('dev'))
      ? 'TEST'
      : 'PROD'
  );
  const [showNktApiKey, setShowNktApiKey] = useState(false);
  const [testingNkt, setTestingNkt] = useState(false);
  const [nktTestResult, setNktTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [testingMpt, setTestingMpt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mptTestResult, setMptTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const effectiveEnv = canSelectEnvironment ? environment : 'PROD';
  const effectiveNktEnv = canSelectEnvironment ? nktEnvironment : 'PROD';
  const nktBaseUrl = effectiveNktEnv === 'TEST' ? 'https://developer.nct.kz/gwp' : 'https://nationalcatalog.kz/gwp';

  useEffect(() => {
    if (initialAccount) {
      setName(initialAccount.name || '');
      setLogin(initialAccount.login || '');
      setPassword('');
      setEnvironment(canSelectEnvironment ? (initialAccount.environment || (isDevOrTest ? 'TEST' : 'PROD')) : 'PROD');
      setSelectedCategories(initialAccount.categories || []);
      setNktApiKey('');
      setNktEnvironment(
        canSelectEnvironment && (initialAccount.nktBaseUrl?.includes('developer') || initialAccount.nktBaseUrl?.includes('test') || initialAccount.nktBaseUrl?.includes('dev'))
          ? 'TEST'
          : 'PROD'
      );
    } else {
      setName('');
      setLogin('');
      setPassword('');
      setEnvironment(canSelectEnvironment && isDevOrTest ? 'TEST' : 'PROD');
      setSelectedCategories([]);
      setNktApiKey('');
      setNktEnvironment('PROD');
    }
    setMptTestResult(null);
    setNktTestResult(null);
    setErrorMsg(null);
  }, [initialAccount, isOpen, isDevOrTest, canSelectEnvironment]);

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

  // Test NKT (developer.nct.kz / nationalcatalog.kz)
  const handleTestNktConnection = async () => {
    // Strip bullet dots (• char code 8226) and non-ASCII chars
    const cleanKey = nktApiKey.replace(/[^\x20-\x7E]/g, '').trim();

    if (!cleanKey && !initialAccount?.hasNktApiKey) {
      setNktTestResult({
        success: true,
        message: 'Используется централизованный шлюз TANBOX для регистрации карточек товаров.',
      });
      return;
    }

    setErrorMsg(null);
    setTestingNkt(true);
    setNktTestResult(null);

    try {
      const testPayload: any = {
        serviceType: 'NKT',
        nktApiKey: cleanKey || undefined,
        nktBaseUrl,
        id: initialAccount?.id,
      };

      const res = await apiClient.post('/markirovka/test-connection', testPayload);

      if (res.data?.success) {
        setNktTestResult({
          success: true,
          message: res.data.message || 'API-ключ Национального каталога товаров (НКТ) проверен успешно!',
        });
      } else {
        setNktTestResult({
          success: false,
          message: res.data?.message || 'Неверный API-ключ НКТ или доступ к GWP ограничен',
        });
      }
    } catch (err: any) {
      setNktTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Ошибка проверки API-ключа НКТ',
      });
    } finally {
      setTestingNkt(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('Укажите название организации');
      return;
    }

    if (!isNktOnly && !login.trim()) {
      setErrorMsg('Укажите логин/БИН для подключения к ИС МПТ');
      return;
    }

    if (!isNktOnly && !initialAccount && !password.trim()) {
      setErrorMsg('Укажите пароль от станции ИС МПТ');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const cleanNktKey = nktApiKey.replace(/[^\x20-\x7E]/g, '').trim();

      if (initialAccount?.id) {
        const updatePayload: any = {
          name: name.trim(),
          login: login.trim() || initialAccount.login,
          environment: effectiveEnv,
          categories: selectedCategories,
          nktBaseUrl,
        };
        if (cleanNktKey) {
          updatePayload.nktApiKey = cleanNktKey;
        }
        if (password.trim()) {
          updatePayload.password = password.trim();
        }
        const res = await apiClient.put(`/markirovka/accounts/${initialAccount.id}`, updatePayload);
        onSuccess(res.data);
      } else {
        const res = await apiClient.post('/markirovka/accounts', {
          name: name.trim(),
          login: login.trim() || '000000000000',
          password: password.trim() || 'temporary_nkt_auth',
          environment: effectiveEnv,
          categories: selectedCategories,
          nktApiKey: cleanNktKey || undefined,
          nktBaseUrl,
        });
        onSuccess(res.data);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Ошибка сохранения настроек');
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
        <div className={`px-6 py-5 border-b border-gray-100 flex items-center justify-between ${
          isNktOnly 
            ? 'bg-gradient-to-r from-emerald-50/70 via-white to-white' 
            : 'bg-gradient-to-r from-blue-50/70 via-white to-white'
        } shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${
              isNktOnly
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : 'bg-blue-50 text-[#0082FB] border-blue-100'
            }`}>
              {isNktOnly ? <Globe className="w-5 h-5" /> : <Barcode className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#111827]">
                {isNktOnly
                  ? (initialAccount ? 'Настройка интеграции с НКТ' : 'Подключение к Национальному каталогу товаров (НКТ)')
                  : (initialAccount ? 'Настройка станции ИС МПТ' : 'Подключение станции ИС МПТ (СУЗ)')}
              </h3>
              <p className="text-xs text-[#64748B]">
                {isNktOnly
                  ? 'nationalcatalog.kz — создание описаний товаров и получение официальных GTIN'
                  : 'markirovka.kz — заказ кодов маркировки DataMatrix и документооборот'}
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

          {/* ======================================================== */}
          {/* CASE 1: PURELY NKT (National Catalog)                     */}
          {/* ======================================================== */}
          {isNktOnly ? (
            <div className="space-y-4">
              {/* Organization Identification (only if new account) */}
              {!initialAccount && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Название организации <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ТОО / ИП"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#111827] focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      БИН организации <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="12 цифр БИН"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#111827] font-mono focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              {/* NKT Environment (PROD vs DEV) - only visible to admins or dev */}
              {canSelectEnvironment && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Контур Национального каталога (НКТ)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setNktEnvironment('PROD')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        nktEnvironment === 'PROD'
                          ? 'bg-white text-emerald-950 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <div>Боевой (PROD)</div>
                      <div className="text-[10px] font-normal text-emerald-700">nationalcatalog.kz</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNktEnvironment('TEST')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        nktEnvironment === 'TEST'
                          ? 'bg-white text-emerald-950 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <div>Тестовый (DEV)</div>
                      <div className="text-[10px] font-normal text-amber-700">developer.nct.kz</div>
                    </button>
                  </div>
                </div>
              )}

              {/* NKT API Key Configuration */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>API-ключ GWP API ({nktEnvironment === 'TEST' ? 'developer.nct.kz' : 'nationalcatalog.kz'})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestNktConnection}
                    disabled={testingNkt}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {testingNkt ? 'Проверка...' : 'Проверить ключ'}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700">
                      Секретный API-Key НКТ
                    </label>
                    {initialAccount?.hasNktApiKey && !nktApiKey && (
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        ✓ Ключ сохранен в профиле
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showNktApiKey ? 'text' : 'password'}
                      placeholder={
                        initialAccount?.hasNktApiKey
                          ? '•••••••••••• (Ключ сохранен, введите новый для смены)'
                          : 'Оставьте пустым для шлюза TANBOX или введите свой ключ'
                      }
                      value={nktApiKey}
                      onChange={(e) => setNktApiKey(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-[#111827] font-mono focus:border-emerald-500 focus:outline-none transition-colors"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNktApiKey(!showNktApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showNktApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-emerald-100 text-[11px] text-gray-600 space-y-1">
                  <p className="font-semibold text-emerald-950">Как получить ключ:</p>
                  <p>
                    1. Войдите с ЭЦП в кабинет{' '}
                    {nktEnvironment === 'TEST' ? (
                      <a href="https://developer.nct.kz" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline">
                        developer.nct.kz (Тестовый контур DEV)
                      </a>
                    ) : (
                      <a href="https://nationalcatalog.kz" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline">
                        nationalcatalog.kz (Боевой контур PROD)
                      </a>
                    )}.
                  </p>
                  <p>
                    2. Перейдите в <strong>«Профиль» → «Доступ к API (GWP)»</strong> (или «Ключи API») и скопируйте API-KEY.
                  </p>
                  <p className="text-gray-400 text-[10px] pt-1">
                    * Если ключ не указан, TANBOX будет использовать централизованный шлюз интеграции.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* CASE 2: PURELY IS MPT (or ALL)                           */
            /* ======================================================== */
            <div className="space-y-4">
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

              {canSelectEnvironment && (
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
                  Товарные группы аккаунта
                </label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { id: 'SHOES', label: 'Обувь', icon: '👟' },
                    { id: 'TEXTILE', label: 'Легпром', icon: '👕' },
                    { id: 'WATER', label: 'Вода', icon: '💧' },
                    { id: 'MEDICINE', label: 'Лекарства', icon: '💊' },
                    { id: 'TOBACCO', label: 'Табак', icon: '🚬' },
                    { id: 'BEER', label: 'Пиво', icon: '🍺' },
                    { id: 'DIETARY_SUPPLEMENTS', label: 'БАДы', icon: '🌿' },
                    { id: 'OILS', label: 'Масла', icon: '🛢️' },
                    { id: 'JEWELRY', label: 'Ювелирка', icon: '💍' },
                    { id: 'OTHER', label: 'Прочее', icon: '📦' },
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

              {/* IS MPT Station Credentials */}
              <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-900 font-bold">
                    <Barcode className="w-4 h-4 text-[#0082FB]" />
                    <span>Авторизация станции в Markirovka.kz</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestMptConnection}
                    disabled={testingMpt || !login || (!initialAccount && !password)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-blue-50 text-[#0082FB] border border-blue-200 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {testingMpt ? 'Проверка...' : 'Проверить станцию'}
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
                    Логин в Markirovka.kz (БИН организации) <span className="text-rose-500">*</span>
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
                    Пароль станции СУЗ Markirovka.kz
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
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-5 py-2.5 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                isNktOnly
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10'
                  : 'bg-[#0082FB] hover:bg-[#0070D8] shadow-blue-500/10'
              }`}
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Сохранение...</span>
                </>
              ) : (
                <span>{isNktOnly ? 'Сохранить настройки НКТ' : 'Сохранить станцию ИС МПТ'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
