import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Server,
  Lock,
  Radio,
  ArrowRight,
  ExternalLink,
  History,
  Database,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader, toast, useModalBehavior } from '@shared';
import { apiClient } from '../api/client';
import { MarkirovkaNav } from '../components/markirovka/MarkirovkaNav';

interface MarkirovkaAccount {
  id: string;
  name: string;
  environment: 'TEST' | 'PROD';
  baseUrl: string;
  login: string;
  omsId?: string;
  status: 'ACTIVE' | 'AUTH_ERROR' | 'DISABLED';
  tokenExpiresAt?: string;
  lastCheckedAt?: string;
  lastError?: string;
  createdAt: string;
  ordersCount: number;
  reportsCount: number;
}

export const AdminMarkirovkaAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<MarkirovkaAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingAccountId, setTestingAccountId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState({
    name: '',
    environment: 'TEST' as 'TEST' | 'PROD',
    baseUrl: 'https://test.markirovka.kz',
    login: '',
    password: '',
    omsId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [modalTestResult, setModalTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isModalTesting, setIsModalTesting] = useState(false);
  const [isModalSaving, setIsModalSaving] = useState(false);

  const { backdropProps, dialogProps } = useModalBehavior({
    onClose: () => setIsModalOpen(false),
    isOpen: isModalOpen,
  });

  // NKT status
  const [nktEnabled, setNktEnabled] = useState<boolean>(true);
  const [togglingNkt, setTogglingNkt] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') {
      toast.error(text);
    } else {
      toast.success(text);
    }
  };

  const fetchNktStatus = async () => {
    try {
      const res = await apiClient.get('/markirovka/nkt-settings');
      if (res.data?.settings) {
        setNktEnabled(Boolean(res.data.settings.enabled));
      }
    } catch {}
  };

  const handleQuickToggleNkt = async () => {
    const nextState = !nktEnabled;
    setTogglingNkt(true);
    try {
      await apiClient.put('/markirovka/nkt-settings', { enabled: nextState });
      setNktEnabled(nextState);
      showToast(
        nextState
          ? 'Поиск по Национальному Каталогу (НКТ) ВКЛЮЧЕН'
          : 'Поиск по Национальному Каталогу (НКТ) ВЫКЛЮЧЕН',
        'success'
      );
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка переключения статуса НКТ', 'error');
    } finally {
      setTogglingNkt(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      fetchNktStatus();
      const res = await apiClient.get('/markirovka/accounts');
      setAccounts(res.data.accounts || []);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка загрузки аккаунтов', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleTestAccountConnection = async (account: MarkirovkaAccount) => {
    try {
      setTestingAccountId(account.id);
      const res = await apiClient.post('/markirovka/test-connection', { id: account.id });
      if (res.data.success) {
        showToast(`Успешно! ${account.name}: соединение установлено`, 'success');
      } else {
        showToast(`Ошибка: ${res.data.message}`, 'error');
      }
      fetchAccounts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка проверки связи', 'error');
    } finally {
      setTestingAccountId(null);
    }
  };

  const openAddModal = () => {
    setEditingAccountId(null);
    setModalForm({
      name: '',
      environment: 'TEST',
      baseUrl: 'https://test.markirovka.kz',
      login: '',
      password: '',
      omsId: '',
    });
    setModalTestResult(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (account: MarkirovkaAccount) => {
    setEditingAccountId(account.id);
    setModalForm({
      name: account.name,
      environment: account.environment,
      baseUrl: account.baseUrl,
      login: account.login,
      password: '',
      omsId: account.omsId || '',
    });
    setModalTestResult(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleModalTestConnection = async () => {
    if (!modalForm.login) {
      showToast('Укажите логин для проверки', 'error');
      return;
    }
    if (!editingAccountId && !modalForm.password) {
      showToast('Укажите пароль для проверки', 'error');
      return;
    }

    try {
      setIsModalTesting(true);
      setModalTestResult(null);
      const res = await apiClient.post('/markirovka/test-connection', {
        id: editingAccountId || undefined,
        environment: modalForm.environment,
        baseUrl: modalForm.baseUrl,
        login: modalForm.login,
        password: modalForm.password || undefined,
        omsId: modalForm.omsId || undefined,
      });
      setModalTestResult(res.data);
      if (res.data.success) {
        showToast('Проверка успешна: токен получен', 'success');
      } else {
        showToast(`Ошибка: ${res.data.message}`, 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Ошибка подключения';
      setModalTestResult({ success: false, message: msg });
      showToast(msg, 'error');
    } finally {
      setIsModalTesting(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.name || !modalForm.login) {
      showToast('Заполните обязательные поля (Название и Логин)', 'error');
      return;
    }
    if (!editingAccountId && !modalForm.password) {
      showToast('Укажите пароль аккаунта', 'error');
      return;
    }

    try {
      setIsModalSaving(true);
      if (editingAccountId) {
        await apiClient.put(`/markirovka/accounts/${editingAccountId}`, {
          name: modalForm.name,
          environment: modalForm.environment,
          baseUrl: modalForm.baseUrl,
          login: modalForm.login,
          password: modalForm.password || undefined,
          omsId: modalForm.omsId || null,
        });
        showToast('Аккаунт успешно обновлен', 'success');
      } else {
        await apiClient.post('/markirovka/accounts', {
          name: modalForm.name,
          environment: modalForm.environment,
          baseUrl: modalForm.baseUrl,
          login: modalForm.login,
          password: modalForm.password,
          omsId: modalForm.omsId || null,
        });
        showToast('Новый аккаунт успешно добавлен', 'success');
      }
      setIsModalOpen(false);
      fetchAccounts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка сохранения аккаунта', 'error');
    } finally {
      setIsModalSaving(false);
    }
  };

  const handleDeleteAccount = async (account: MarkirovkaAccount) => {
    if (!window.confirm(`Вы уверены, что хотите удалить аккаунт «${account.name}»?`)) {
      return;
    }
    try {
      await apiClient.delete(`/markirovka/accounts/${account.id}`);
      showToast(`Аккаунт «${account.name}» удален`, 'success');
      fetchAccounts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка удаления аккаунта', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Подключенные аккаунты ИС МПТ"
        description="Управление учетными записями test.markirovka.kz и prod.markirovka.kz (эмиссия и утилизация кодов)"
        action={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchAccounts}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0082FB]' : ''}`} />
              Обновить
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0082FB] hover:bg-[#0072DD] text-white text-xs font-extrabold shadow-md shadow-[#0082FB]/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Добавить аккаунт
            </button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <MarkirovkaNav />

      {/* NKT Fast Status & Toggle Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              nktEnabled ? 'bg-blue-50 text-[#0082FB]' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-gray-900">
                Национальный Каталог Товаров (НКТ)
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                  nktEnabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {nktEnabled ? 'Поиск активен' : 'Отключен'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {nktEnabled
                ? 'Запросы в nationalcatalog.kz по GTIN включены для всех заказов и клиентов'
                : 'Поиск по базе НКТ временно приостановлен в настройках платформы'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/markirovka/nkt"
            className="text-xs font-bold text-[#0082FB] hover:underline"
          >
            Настройки API & Тест
          </Link>
          <button
            type="button"
            onClick={handleQuickToggleNkt}
            disabled={togglingNkt}
            title={nktEnabled ? 'Отключить поиск по НКТ' : 'Включить поиск по НКТ'}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
              nktEnabled ? 'bg-[#0082FB]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                nktEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Accounts Grid */}
      <div>
        {loading && accounts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400 text-sm">
            Загрузка списка аккаунтов...
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0082FB] mx-auto flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Нет подключенных аккаунтов</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                Добавьте логин и пароль от личного кабинета markirovka.kz для автоматического заказа и утилизации кодов.
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0082FB] text-white text-xs font-bold shadow-md shadow-[#0082FB]/20 hover:bg-[#0072DD]"
            >
              <Plus className="w-4 h-4" />
              Подключить первый аккаунт
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accounts.map((acc) => {
              const isTest = acc.environment === 'TEST';
              const isCheckingThis = testingAccountId === acc.id;

              return (
                <div
                  key={acc.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-gray-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Environment & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          isTest
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isTest ? 'Тест (test.markirovka.kz)' : 'Боевой (prod.markirovka.kz)'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            acc.status === 'ACTIVE'
                              ? 'bg-emerald-500 animate-pulse'
                              : acc.status === 'AUTH_ERROR'
                              ? 'bg-rose-500'
                              : 'bg-gray-400'
                          }`}
                        />
                        <span className="text-[11px] font-extrabold text-gray-600">
                          {acc.status === 'ACTIVE'
                            ? 'Активен'
                            : acc.status === 'AUTH_ERROR'
                            ? 'Ошибка авторизации'
                            : 'Отключен'}
                        </span>
                      </div>
                    </div>

                    {/* Account Name */}
                    <h3 className="text-base font-extrabold text-black mb-1">{acc.name}</h3>
                    <p className="text-xs font-mono text-gray-400 mb-4 truncate">{acc.baseUrl}</p>

                    {/* Info rows */}
                    <div className="bg-gray-50/80 rounded-xl p-3 space-y-2 border border-gray-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Логин:</span>
                        <span className="font-mono font-bold text-gray-900">{acc.login}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Статус токена:</span>
                        <span
                          className={`font-bold ${
                            acc.tokenExpiresAt && new Date(acc.tokenExpiresAt) > new Date()
                              ? 'text-emerald-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {acc.tokenExpiresAt && new Date(acc.tokenExpiresAt) > new Date()
                            ? 'Действителен'
                            : 'Не получен / истек'}
                        </span>
                      </div>
                      {acc.lastCheckedAt && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">Проверен:</span>
                          <span className="text-gray-600">
                            {new Date(acc.lastCheckedAt).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {acc.lastError && (
                      <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-[11px] text-rose-700 leading-tight">
                        <span className="font-bold">Ошибка: </span>
                        {acc.lastError}
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleTestAccountConnection(acc)}
                      disabled={isCheckingThis}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingThis ? 'animate-spin text-[#0082FB]' : ''}`} />
                      {isCheckingThis ? 'Проверка...' : 'Проверить связь'}
                    </button>

                    <Link
                      to="/markirovka/activity"
                      state={{ accountId: acc.id }}
                      className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-[#0082FB] transition-colors"
                      title="Перейти к операциям этого клиента"
                    >
                      <History className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => openEditModal(acc)}
                      className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
                      title="Редактировать"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteAccount(acc)}
                      className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && createPortal(
        <div
          {...backdropProps}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-150 select-auto"
        >
          <div
            {...dialogProps}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0082FB] border border-blue-100/60 flex items-center justify-center font-bold">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-black">
                    {editingAccountId ? 'Редактирование аккаунта' : 'Подключение аккаунта Markirovka.kz'}
                  </h3>
                  <p className="text-[11px] text-gray-400">Авторизация по логину и паролю (без ЭЦП)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Название аккаунта *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: ТОО Ромашка (Обувь)"
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Контур *
                  </label>
                  <select
                    value={modalForm.environment}
                    onChange={(e) => {
                      const env = e.target.value as 'TEST' | 'PROD';
                      setModalForm({
                        ...modalForm,
                        environment: env,
                        baseUrl: env === 'TEST' ? 'https://test.markirovka.kz' : 'https://prod.markirovka.kz',
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#0082FB]"
                  >
                    <option value="TEST">Тестовый (test)</option>
                    <option value="PROD">Боевой (prod)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    URL сервера
                  </label>
                  <input
                    type="text"
                    required
                    value={modalForm.baseUrl}
                    onChange={(e) => setModalForm({ ...modalForm, baseUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none focus:border-[#0082FB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Логин (ИНН/БИН или логин) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="970740000362 или user1"
                    value={modalForm.login}
                    onChange={(e) => setModalForm({ ...modalForm, login: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold font-mono focus:outline-none focus:border-[#0082FB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    {editingAccountId ? 'Новый пароль (если меняется)' : 'Пароль *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingAccountId}
                      placeholder={editingAccountId ? 'Оставить прежний' : '••••••••'}
                      value={modalForm.password}
                      onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold font-mono pr-9 focus:outline-none focus:border-[#0082FB]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  ID склада / Филиала (businessPlaceId)
                </label>
                <input
                  type="text"
                  placeholder="Оставьте пустым для автоопределения или укажите число (напр. 44)"
                  value={modalForm.omsId}
                  onChange={(e) => setModalForm({ ...modalForm, omsId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              {/* Test Connection Button in Modal */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleModalTestConnection}
                  disabled={isModalTesting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#0082FB] text-xs font-extrabold transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isModalTesting ? 'animate-spin' : ''}`} />
                  {isModalTesting ? 'Проверка подключения через API...' : 'Проверить подключение сейчас'}
                </button>

                {modalTestResult && (
                  <div
                    className={`mt-2.5 p-3 rounded-xl border text-xs font-semibold ${
                      modalTestResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-0.5">
                      {modalTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>{modalTestResult.success ? 'Успешно!' : 'Ошибка проверки:'}</span>
                    </div>
                    <div className="text-[11px] pl-5.5">{modalTestResult.message}</div>
                  </div>
                )}
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isModalSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#0082FB] hover:bg-[#0072DD] text-white text-xs font-extrabold shadow-md shadow-[#0082FB]/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isModalSaving ? 'Сохранение...' : editingAccountId ? 'Сохранить изменения' : 'Подключить аккаунт'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
