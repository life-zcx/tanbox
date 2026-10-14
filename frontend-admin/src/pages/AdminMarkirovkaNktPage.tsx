import React, { useState, useEffect } from 'react';
import {
  Database,
  Power,
  RefreshCw,
  Key,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Search,
  ExternalLink,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@shared';
import { apiClient } from '../api/client';
import { MarkirovkaNav } from '../components/markirovka/MarkirovkaNav';

interface NktSettings {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const AdminMarkirovkaNktPage: React.FC = () => {
  const [settings, setSettings] = useState<NktSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  // Form state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Test connection state
  const [testGtin, setTestGtin] = useState('0200120931509');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    sampleProduct?: any;
    latencyMs?: number;
  } | null>(null);

  // Toast message
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/markirovka/nkt-settings');
      if (res.data?.settings) {
        setSettings(res.data.settings);
        setApiKeyInput(res.data.settings.apiKey || '');
        setBaseUrlInput(res.data.settings.baseUrl || 'https://nationalcatalog.kz/gwp');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка загрузки настроек НКТ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleEnabled = async () => {
    if (!settings) return;
    const nextState = !settings.enabled;
    setSavingToggle(true);
    try {
      const res = await apiClient.put('/markirovka/nkt-settings', {
        enabled: nextState,
      });
      if (res.data?.settings) {
        setSettings(res.data.settings);
      } else {
        setSettings((prev) => (prev ? { ...prev, enabled: nextState } : null));
      }
      showToast(
        nextState
          ? 'Поиск по Национальному Каталогу (НКТ) успешно ВКЛЮЧЕН'
          : 'Поиск по Национальному Каталогу (НКТ) ВЫКЛЮЧЕН',
        'success'
      );
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка переключения статуса', 'error');
    } finally {
      setSavingToggle(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      showToast('Укажите API-ключ НКТ', 'error');
      return;
    }
    setSavingKey(true);
    try {
      const res = await apiClient.put('/markirovka/nkt-settings', {
        apiKey: apiKeyInput.trim(),
        baseUrl: baseUrlInput.trim() || 'https://nationalcatalog.kz/gwp',
      });
      if (res.data?.settings) {
        setSettings(res.data.settings);
      }
      showToast('Параметры подключения к НКТ успешно сохранены', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка сохранения настроек', 'error');
    } finally {
      setSavingKey(false);
    }
  };

  const handleRunConnectionTest = async () => {
    if (!testGtin.trim()) {
      showToast('Введите GTIN для тестового запроса', 'error');
      return;
    }
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await apiClient.post('/markirovka/nkt-test', {
        apiKey: apiKeyInput.trim() || undefined,
        gtin: testGtin.trim(),
      });
      setTestResult(res.data);
      if (res.data?.success) {
        showToast('Тест связи успешен: карточка товара получена', 'success');
      } else {
        showToast(res.data?.message || 'Ошибка ответа НКТ', 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Ошибка проверки связи';
      setTestResult({ success: false, message: msg });
      showToast(msg, 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const isEnabled = settings?.enabled ?? true;

  return (
    <div className="space-y-6 w-full">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2.5 transition-all ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Национальный Каталог Товаров (НКТ)"
        description="Управление интеграцией с nationalcatalog.kz: поиск карточек товаров, автозаполнение SKU и макетов"
        action={
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0082FB]' : ''}`} />
            Обновить
          </button>
        }
      />

      {/* Navigation Tabs */}
      <MarkirovkaNav />

      {/* Master Toggle Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                }`}
              />
              <h2 className="text-base font-extrabold text-gray-900">
                Поиск и автозаполнение по Национальному Каталогу
              </h2>
            </div>
            <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
              При включенном поиске система автоматически запрашивает данные о товаре (наименование, артикул, размер, цвет, бренд, ТН ВЭД) через официальный шлюз{' '}
              <strong className="text-gray-700">nationalcatalog.kz</strong>. При выключении внешние запросы в каталог блокируются.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                isEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {isEnabled ? 'АКТИВЕН' : 'ОТКЛЮЧЕН'}
            </span>

            <button
              type="button"
              onClick={handleToggleEnabled}
              disabled={savingToggle || loading}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                isEnabled ? 'bg-[#0082FB]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Current State Info Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Статус сервиса
            </span>
            <span
              className={`text-xs font-black mt-0.5 block ${
                isEnabled ? 'text-emerald-700' : 'text-gray-600'
              }`}
            >
              {isEnabled ? 'Поиск включен для всех заказов' : 'Запросы в НКТ приостановлены'}
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Шлюз API
            </span>
            <span className="text-xs font-bold text-gray-800 mt-0.5 block truncate">
              {settings?.baseUrl || 'https://nationalcatalog.kz/gwp'}
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Последнее изменение
            </span>
            <span className="text-xs font-semibold text-gray-600 mt-0.5 block">
              {settings?.updatedAt
                ? new Date(settings.updatedAt).toLocaleString('ru-RU')
                : 'По умолчанию'}
              {settings?.updatedBy ? ` (${settings.updatedBy})` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Settings Form & Live Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: API Configuration */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-[#0082FB]" />
                Параметры авторизации API
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Ключ доступа к государственному каталогу (X-API-KEY)
              </p>
            </div>
            <a
              href="https://nationalcatalog.kz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#0082FB] hover:underline inline-flex items-center gap-1"
            >
              Портал НКТ
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                API-ключ каталога (X-API-KEY)
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Введите ключ доступа..."
                  className="w-full px-3.5 py-2.5 pr-10 border border-gray-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0082FB]/20 focus:border-[#0082FB]"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Используется для заголовка <code className="text-gray-600">X-API-KEY</code> при обращении к <code className="text-gray-600">/portal/api/v1/products/&#123;tin&#125;</code>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Базовый URL шлюза API
              </label>
              <input
                type="text"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="https://nationalcatalog.kz/gwp"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0082FB]/20 focus:border-[#0082FB]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                disabled={savingKey || loading}
                className="px-4 py-2 bg-[#0082FB] hover:bg-[#0072DD] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {savingKey ? 'Сохранение...' : 'Сохранить параметры'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setApiKeyInput('');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Очистить поле ключа
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Connection Tester */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#0082FB]" />
              Тест соединения и поиска товара
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Отправляет мгновенный проверочный запрос в НКТ с указанным штрихкодом
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Проверочный GTIN / NTIN товара
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={testGtin}
                  onChange={(e) => setTestGtin(e.target.value)}
                  placeholder="Например: 0200120931509"
                  className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0082FB]/20 focus:border-[#0082FB]"
                />
                <button
                  type="button"
                  onClick={handleRunConnectionTest}
                  disabled={testingConnection || loading}
                  className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-blue-400' : ''}`}
                  />
                  {testingConnection ? 'Проверка...' : 'Проверить'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Рекомендуемый зарегистрированный штрихкод для теста: <code className="text-gray-600 cursor-pointer" onClick={() => setTestGtin('0200120931509')}>0200120931509</code>
              </p>
            </div>

            {/* Test Result Display */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
                  testResult.success
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-red-50/70 border-red-200 text-red-950'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    {testResult.success ? 'Ответ 200 OK' : 'Ошибка запроса'}
                  </span>
                  {testResult.latencyMs !== undefined && (
                    <span className="text-[11px] text-gray-500 font-mono">
                      Задержка: {testResult.latencyMs} мс
                    </span>
                  )}
                </div>

                <p className="text-[11px] leading-relaxed">{testResult.message}</p>

                {testResult.sampleProduct && (
                  <div className="pt-2 border-t border-emerald-200/80 space-y-1 text-[11px]">
                    <div>
                      <span className="font-bold text-gray-700">Наименование: </span>
                      <span>{testResult.sampleProduct.name || '—'}</span>
                    </div>
                    {testResult.sampleProduct.brand && (
                      <div>
                        <span className="font-bold text-gray-700">Бренд: </span>
                        <span>{testResult.sampleProduct.brand}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-gray-700">GTIN: </span>
                      <span className="font-mono">{testResult.sampleProduct.gtin}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info & Rules Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#0082FB]" />
          Как работает интеграция с Национальным Каталогом
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs text-gray-600">
          <div className="p-3 bg-gray-50 rounded-xl space-y-1">
            <strong className="text-gray-900 block">Поиск по GTIN и NTIN</strong>
            <p className="text-[11px] leading-relaxed">
              Шлюз автоматически проверяет 14-значные и 13-значные штрихкоды. При совпадении карточка связывается со спецификацией партии.
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl space-y-1">
            <strong className="text-gray-900 block">Защита от лишних запросов</strong>
            <p className="text-[11px] leading-relaxed">
              Если товар уже сохранен в базе заказов, система не отправляет повторные сетевые запросы в НКТ, защищая от перерасхода лимитов API.
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl space-y-1">
            <strong className="text-gray-900 block">Автозаполнение этикеток</strong>
            <p className="text-[11px] leading-relaxed">
              Все извлеченные поля (артикул, размер, цвет, ТН ВЭД, бренд, состав) сразу доступны в конструкторе макетов и генерации этикеток.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
