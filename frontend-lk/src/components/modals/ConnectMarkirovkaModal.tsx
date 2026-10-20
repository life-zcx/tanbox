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
import { useModalBehavior } from '@shared';

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
  const [checkingParty, setCheckingParty] = useState(false);

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

  // Auto-lookup participant registered product groups when 12-digit BIN is entered
  useEffect(() => {
    if (!isOpen) return;
    const cleanTin = login.replace(/\D/g, '').trim();
    if (cleanTin.length !== 12) return;

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setCheckingParty(true);
        const res = await apiClient.get(`/markirovka/party/status?tin=${cleanTin}`);
        if (!isMounted) return;
        if (res.data?.registered && res.data?.data) {
          if (Array.isArray(res.data.categories) && res.data.categories.length > 0) {
            setSelectedCategories(res.data.categories);
          }
          if (res.data.data.nameRu && !name.trim()) {
            setName(res.data.data.nameRu);
          }
        }
      } catch (e) {
        // silent fallback
      } finally {
        if (isMounted) setCheckingParty(false);
      }
    }, 600);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [login, isOpen]);

  const { backdropProps, dialogProps } = useModalBehavior({ onClose, isOpen });

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
        if (Array.isArray(res.data?.categories) && res.data.categories.length > 0) {
          setSelectedCategories(res.data.categories);
        }
        if (res.data?.autoDetectedName && !name.trim()) {
          setName(res.data.autoDetectedName);
        }
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
        success: false,
        message: 'Укажите API-ключ НКТ для проверки соединения',
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

    if (!isNktOnly && !login.trim() && !initialAccount?.login) {
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

      const effectiveName =
        name.trim() ||
        initialAccount?.name ||
        user?.companyName ||
        (isNktOnly ? 'Организация НКТ' : 'Организация ИС МПТ');
      const effectiveLogin = isNktOnly
        ? (initialAccount?.login || user?.binIin || '000000000000')
        : (login.trim() || initialAccount?.login || '000000000000');

      if (initialAccount?.id) {
        const updatePayload: any = {
          name: effectiveName,
          login: effectiveLogin,
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
          name: effectiveName,
          login: effectiveLogin,
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
    <div
      {...backdropProps}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
    >
      {/* Modal Dialog */}
      <div
        {...dialogProps}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50 text-[#0082FB] border border-blue-100/60 shadow-2xs">
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
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* CASE 1: PURELY NKT (National Catalog)                     */}
          {/* ======================================================== */}
          {isNktOnly ? (
            <div className="space-y-4">
              {/* NKT Environment (PROD vs DEV) - only visible to admins or dev */}
              {canSelectEnvironment && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Контур интеграции
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setNktEnvironment('PROD')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        nktEnvironment === 'PROD'
                          ? 'bg-white text-[#111827] shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Боевой (nationalcatalog.kz)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNktEnvironment('TEST')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        nktEnvironment === 'TEST'
                          ? 'bg-white text-[#111827] shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Тестовый (developer.nct.kz)
                    </button>
                  </div>
                </div>
              )}

              {/* NKT API Key Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    API-ключ Национального каталога (НКТ)
                  </label>
                  <button
                    type="button"
                    onClick={handleTestNktConnection}
                    disabled={testingNkt}
                    className="text-xs font-semibold text-[#0082FB] hover:text-blue-700 cursor-pointer disabled:opacity-50"
                  >
                    {testingNkt ? 'Проверка...' : 'Проверить ключ'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNktApiKey ? 'text' : 'password'}
                    placeholder={
                      initialAccount?.hasNktApiKey
                        ? '•••••••••••• (Ключ сохранен, введите новый для смены)'
                        : 'Вставьте API-ключ из кабинета НКТ'
                    }
                    value={nktApiKey}
                    onChange={(e) => setNktApiKey(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-xs text-[#111827] font-mono focus:border-[#0082FB] focus:outline-none transition-colors"
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

                {nktTestResult && (
                  <div className={`mt-2 p-2.5 rounded-xl flex items-start gap-2 text-xs border ${
                    nktTestResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {nktTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    )}
                    <span>{nktTestResult.message}</span>
                  </div>
                )}

                <p className="text-[11px] text-gray-500 mt-2">
                  Ключ можно скопировать в кабинете{' '}
                  <a
                    href={nktEnvironment === 'TEST' ? 'https://developer.nct.kz' : 'https://nationalcatalog.kz'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0082FB] hover:underline font-semibold"
                  >
                    {nktEnvironment === 'TEST' ? 'developer.nct.kz' : 'nationalcatalog.kz'}
                  </a>{' '}
                  в разделе <strong>«Профиль» → «Доступ к API (GWP)»</strong>.
                </p>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* CASE 2: PURELY IS MPT (or ALL)                           */
            /* ======================================================== */
            <div className="space-y-4">
              {canSelectEnvironment && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
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

              {/* Login (BIN) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Логин в Markirovka.kz (БИН организации) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="12-значный БИН или логин"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-xs text-[#111827] font-mono focus:border-[#0082FB] focus:outline-none transition-colors"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Пароль станции СУЗ Markirovka.kz
                    {initialAccount && <span className="font-normal text-gray-400 ml-1">(оставьте пустым, если не меняется)</span>}
                    {!initialAccount && <span className="text-rose-500">*</span>}
                  </label>
                  <button
                    type="button"
                    onClick={handleTestMptConnection}
                    disabled={testingMpt || !login || (!initialAccount && !password)}
                    className="text-xs font-semibold text-[#0082FB] hover:text-blue-700 cursor-pointer disabled:opacity-50"
                  >
                    {testingMpt ? 'Проверка...' : 'Проверить станцию'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={initialAccount ? '••••••••••••' : 'Пароль от кабинета ИС МПТ'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-xs text-[#111827] focus:border-[#0082FB] focus:outline-none transition-colors"
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

                {mptTestResult && (
                  <div className={`mt-2 p-2.5 rounded-xl flex items-start gap-2 text-xs border ${
                    mptTestResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {mptTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    )}
                    <span>{mptTestResult.message}</span>
                  </div>
                )}
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
              className="px-5 py-2.5 text-white font-bold rounded-xl text-xs bg-[#0082FB] hover:bg-[#0070D8] shadow-md shadow-blue-500/10 transition-all cursor-pointer flex items-center gap-2"
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
