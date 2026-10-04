import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  Hash,
  ShieldCheck,
  Calendar,
  Package,
  Palette,
  Edit3,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Save,
  Trash2,
  Copy,
  Check,
  Plus,
  RefreshCw,
  X,
  Lock,
  Layers,
  Clock,
} from 'lucide-react';
import { UserDetail } from '../types';
import { apiClient } from '../api/client';
import { StatusBadge } from '@shared';
import { StickerCanvasPreview } from '../components/common/StickerCanvasPreview';
import { formatPhoneNumber, isValidPhoneNumber, getPhoneDigitsCount } from '../utils/phone';

export const AdminUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'templates'>('profile');
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>('');
  const [binIin, setBinIin] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState<boolean>(false);
  const [role, setRole] = useState<'CLIENT' | 'ADMIN'>('CLIENT');
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Template deletion state
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [templateActionMsg, setTemplateActionMsg] = useState<string | null>(null);

  // Copy ID feedback
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const fetchUser = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/users/${id}`);
      const data: UserDetail = res.data;
      setUserDetail(data);

      setCompanyName(data.companyName || '');
      setBinIin(data.binIin || '');
      setEmail(data.email || '');
      setPhone(formatPhoneNumber(data.phone || ''));
      setPhoneError(null);
      setPhoneTouched(false);
      setRole(data.role || 'CLIENT');
      setNewPassword('');
    } catch (err: any) {
      console.error('Failed to fetch user:', err);
      setError(err.response?.data?.message || 'Не удалось загрузить данные пользователя');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleCopyId = () => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCancelEdit = () => {
    if (!userDetail) return;
    setCompanyName(userDetail.companyName || '');
    setBinIin(userDetail.binIin || '');
    setEmail(userDetail.email || '');
    setPhone(formatPhoneNumber(userDetail.phone || ''));
    setPhoneError(null);
    setPhoneTouched(false);
    setRole(userDetail.role || 'CLIENT');
    setNewPassword('');
    setSaveErrorMsg(null);
    setIsEditingProfile(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatPhoneNumber(raw);
    setPhone(formatted);
    if (phoneTouched) {
      if (formatted && !isValidPhoneNumber(formatted)) {
        setPhoneError('Введите полный номер телефона (11 цифр)');
      } else {
        setPhoneError(null);
      }
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    if (phone && !isValidPhoneNumber(phone)) {
      setPhoneError('Введите полный номер: +7 (XXX) XXX-XX-XX');
    } else {
      setPhoneError(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    const cleanBin = binIin.replace(/\D/g, '');
    if (cleanBin.length !== 12) {
      setSaveErrorMsg('БИН/ИИН должен содержать ровно 12 цифр');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setSaveErrorMsg('Укажите корректный адрес электронной почты');
      return;
    }

    if (!companyName.trim()) {
      setSaveErrorMsg('Укажите название компании или ИП');
      return;
    }

    if (!phone.trim()) {
      setPhoneTouched(true);
      setPhoneError('Номер телефона обязателен для заполнения');
      setSaveErrorMsg('Пожалуйста, укажите номер телефона клиента');
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      setPhoneTouched(true);
      setPhoneError('Введите полный номер телефона: +7 (XXX) XXX-XX-XX');
      setSaveErrorMsg('Пожалуйста, укажите корректный 11-значный номер телефона');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        companyName: companyName.trim(),
        binIin: cleanBin,
        email: email.trim(),
        phone: phone.trim(),
        role,
      };

      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const res = await apiClient.patch(`/users/${id}`, payload);
      const updatedUser = res.data.user;

      setUserDetail((prev) => (prev ? { ...prev, ...updatedUser } : null));
      setPhone(formatPhoneNumber(updatedUser.phone || ''));
      setPhoneError(null);
      setPhoneTouched(false);
      setNewPassword('');
      setIsEditingProfile(false);
      setSaveSuccessMsg('Данные клиента успешно сохранены и обновлены в системе');
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Failed to update user profile:', err);
      setSaveErrorMsg(err.response?.data?.message || 'Ошибка при сохранении данных пользователя');
      setTimeout(() => setSaveErrorMsg(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!window.confirm(`Вы действительно хотите безвозвратно удалить шаблон «${templateName}» из библиотеки клиента?`)) {
      return;
    }

    setDeletingTemplateId(templateId);
    setTemplateActionMsg(null);
    try {
      await apiClient.delete(`/user-templates/${templateId}`);

      setUserDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stickerTemplates: (prev.stickerTemplates || []).filter((t) => t.id !== templateId),
        };
      });

      setTemplateActionMsg(`Шаблон «${templateName}» успешно удален из библиотеки.`);
      setTimeout(() => setTemplateActionMsg(null), 5000);
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      alert('Ошибка при удалении шаблона: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingTemplateId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-[#0082FB] animate-spin" />
        <span className="text-xs font-bold text-gray-500">Загрузка данных карточки клиента...</span>
      </div>
    );
  }

  if (error || !userDetail) {
    return (
      <div className="w-full space-y-4 pt-6">
        <Link
          to="/users"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к списку пользователей
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-extrabold text-sm">Ошибка загрузки</h3>
            <p className="text-xs mt-0.5">{error || 'Пользователь не найден'}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalOrders = userDetail.orders?.length || 0;
  const totalSpent = (userDetail.orders || []).reduce((sum, ord) => sum + (ord.totalPrice || 0), 0);
  const totalTemplates = userDetail.stickerTemplates?.length || 0;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-gray-600 hover:text-black bg-white hover:bg-gray-100 border border-gray-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            К реестру пользователей
          </button>
          <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
          <span className="text-xs font-medium text-gray-500 hidden sm:inline">
            Карточка клиента / <strong className="text-gray-900">{userDetail.companyName}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyId}
          className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg shadow-2xs cursor-pointer transition-colors"
          title="Скопировать ID пользователя"
        >
          {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>ID: {userDetail.id.slice(0, 8)}...</span>
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-[#111827]">
                {userDetail.companyName}
              </h1>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  userDetail.role === 'ADMIN'
                    ? 'bg-black text-white'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {userDetail.role === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
                {userDetail.role}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B] mt-1 font-medium">
              <span className="flex items-center gap-1 font-mono">
                <Hash className="w-3.5 h-3.5 text-gray-400" /> БИН/ИИН: <strong>{userDetail.binIin}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> {userDetail.email}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> {formatPhoneNumber(userDetail.phone) || userDetail.phone}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Link
              to={`/label-designer?userId=${userDetail.id}`}
              className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-2xs active:scale-95"
            >
              <Palette className="w-4 h-4 text-blue-600" />
              <span>Создать макет</span>
            </Link>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4">
            <div className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-600" />
              Заказов всего
            </div>
            <div className="text-xl font-black text-[#111827] mt-1">
              {totalOrders.toLocaleString('ru-RU')} <span className="text-xs font-semibold text-gray-500">шт.</span>
            </div>
          </div>

          <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4">
            <div className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">₸</span>
              Сумма заказов
            </div>
            <div className="text-xl font-black text-emerald-600 mt-1">
              {totalSpent.toLocaleString('ru-RU')} ₸
            </div>
          </div>

          <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4">
            <div className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              Шаблонов
            </div>
            <div className="text-xl font-black text-[#111827] mt-1">
              {totalTemplates} <span className="text-xs font-semibold text-gray-500">шт.</span>
            </div>
          </div>

          <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4">
            <div className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              Дата регистрации
            </div>
            <div className="text-sm font-black text-[#111827] mt-1.5">
              {new Date(userDetail.createdAt).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-black hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Реквизиты и профиль
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-black hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Заказы ({totalOrders})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-black hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          Шаблоны ({totalTemplates})
        </button>
      </div>

      {/* Tab 1: Profile View / Edit */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-6">
            <div>
              <h2 className="text-base font-extrabold text-[#111827]">
                Реквизиты и учетные данные клиента
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                {isEditingProfile
                  ? 'Режим редактирования: внесите изменения в поля ниже и сохраните'
                  : 'Просмотр данных профиля. Для изменения нажмите кнопку «Редактировать»'}
              </p>
            </div>

            {!isEditingProfile && (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="inline-flex items-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Редактировать профиль</span>
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-4xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-extrabold text-[#111827] uppercase tracking-wider mb-2">
                    Наименование компании / ИП <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs font-bold border border-gray-300 rounded-xl p-3 focus:border-[#0082FB] focus:outline-none bg-white transition-all shadow-2xs"
                    placeholder="ТОО Название"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#111827] uppercase tracking-wider mb-2">
                    БИН / ИИН (12 цифр) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={binIin}
                    onChange={(e) => setBinIin(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs font-mono font-bold border border-gray-300 rounded-xl p-3 focus:border-[#0082FB] focus:outline-none bg-white transition-all shadow-2xs"
                    placeholder="123456789012"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#111827] uppercase tracking-wider mb-2">
                    Email адрес <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs font-bold border border-gray-300 rounded-xl p-3 focus:border-[#0082FB] focus:outline-none bg-white transition-all shadow-2xs"
                    placeholder="client@company.kz"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-extrabold text-[#111827] uppercase tracking-wider">
                      Номер телефона <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-mono font-semibold text-gray-400">
                      {phone ? `${getPhoneDigitsCount(phone)} из 11 цифр` : 'Казахстан / РФ (+7)'}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={18}
                      value={phone}
                      onChange={handlePhoneChange}
                      onBlur={handlePhoneBlur}
                      onFocus={() => {
                        if (!phone) setPhone('+7 (');
                      }}
                      className={`w-full text-xs font-mono font-bold border rounded-xl py-3 pl-10 pr-10 focus:outline-none transition-all shadow-2xs ${
                        phoneError
                          ? 'border-red-400 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                          : isValidPhoneNumber(phone)
                          ? 'border-emerald-400 bg-emerald-50/15 text-gray-900 focus:border-emerald-500'
                          : 'border-gray-300 bg-white focus:border-[#0082FB]'
                      }`}
                      placeholder="+7 (701) 123-45-67"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      {isValidPhoneNumber(phone) && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                      {phoneError && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  {phoneError ? (
                    <p className="mt-1.5 text-[11px] font-bold text-red-500 flex items-center gap-1 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {phoneError}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[10px] text-gray-400 font-medium">
                      Формат ввода: +7 (XXX) XXX-XX-XX
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#111827] uppercase tracking-wider mb-2">
                    Роль в системе <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full text-xs font-bold border border-gray-300 rounded-xl p-3 focus:border-[#0082FB] focus:outline-none bg-white cursor-pointer transition-all shadow-2xs"
                  >
                    <option value="CLIENT">CLIENT — Клиент личного кабинета</option>
                    <option value="ADMIN">ADMIN — Администратор платформы</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#111827] uppercase tracking-wider mb-2">
                    Новый пароль <span className="text-gray-400 font-normal lowercase">(оставьте пустым, если без изменений)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 8 символов"
                      className="w-full text-xs font-bold border border-gray-300 rounded-xl p-3 pr-10 focus:border-[#0082FB] focus:outline-none bg-white transition-all shadow-2xs"
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

              {role === 'ADMIN' && (
                <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-800 text-xs flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Внимание:</strong> Роль <strong>ADMIN</strong> наделяет пользователя полными правами управления платформой, заказами, ценами и другими пользователями.
                  </span>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white text-xs font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="space-y-6 max-w-4xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <span className="block text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Наименование компании / ИП
                  </span>
                  <div className="w-full text-xs font-extrabold text-[#111827] bg-gray-50/80 border border-gray-200/80 rounded-xl p-3.5">
                    {companyName || '—'}
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider mb-1.5">
                    БИН / ИИН (12 цифр)
                  </span>
                  <div className="w-full text-xs font-mono font-bold text-[#111827] bg-gray-50/80 border border-gray-200/80 rounded-xl p-3.5">
                    {binIin || '—'}
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Email адрес
                  </span>
                  <div className="w-full text-xs font-bold text-[#111827] bg-gray-50/80 border border-gray-200/80 rounded-xl p-3.5">
                    {email || '—'}
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Номер телефона
                  </span>
                  <div className="w-full text-xs font-mono font-bold text-[#111827] bg-gray-50/80 border border-gray-200/80 rounded-xl p-3.5">
                    {phone || '—'}
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Роль в системе
                  </span>
                  <div className="w-full text-xs font-bold text-[#111827] bg-gray-50/80 border border-gray-200/80 rounded-xl p-3.5 flex items-center justify-between">
                    <span>{role === 'ADMIN' ? 'ADMIN — Администратор платформы' : 'CLIENT — Клиент личного кабинета'}</span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${role === 'ADMIN' ? 'bg-black text-white' : 'bg-blue-100 text-blue-700'}`}>
                      {role}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Пароль для входа
                  </span>
                  <div className="w-full text-xs font-mono font-bold text-gray-400 bg-gray-50/80 border border-gray-200/80 rounded-xl p-3.5 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    <span>•••••••••••• (защищен)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Orders List */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#111827]">
                История заказов клиента
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Все заказы на маркировку и печать этикеток, оформленные клиентом
              </p>
            </div>
            <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
              Всего: {totalOrders} шт.
            </span>
          </div>

          {totalOrders === 0 ? (
            <div className="text-center py-16 text-gray-400 text-xs font-bold bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              У этого клиента пока нет оформленных заказов.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">№ Заказа</th>
                    <th className="py-3 px-4">Дата</th>
                    <th className="py-3 px-4">Категория</th>
                    <th className="py-3 px-4">Тариф</th>
                    <th className="py-3 px-4 text-right">Объем</th>
                    <th className="py-3 px-4 text-right">Сумма</th>
                    <th className="py-3 px-4 text-center">Статус</th>
                    <th className="py-3 px-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {userDetail.orders?.map((ord) => (
                    <tr key={ord.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#111827]">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {new Date(ord.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-700">
                        {ord.category}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-700">
                        {ord.tariffType}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {ord.itemsCount.toLocaleString('ru-RU')} шт.
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                        {ord.totalPrice.toLocaleString('ru-RU')} ₸
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/orders/${ord.id}`}
                          className="inline-flex items-center gap-1 bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-xl font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          <span>Открыть</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Saved Templates Library with DELETE functionality */}
      {activeTab === 'templates' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#111827]">
                Библиотека шаблонов этикеток
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Сохраненные макеты стикеров клиента для повторного использования в заказах
              </p>
            </div>
            <Link
              to={`/label-designer?userId=${userDetail.id}`}
              className="inline-flex items-center gap-1.5 bg-[#111827] hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Создать новый шаблон</span>
            </Link>
          </div>

          {totalTemplates === 0 ? (
            <div className="text-center py-16 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <Palette className="w-10 h-10 text-gray-300 mx-auto" />
              <div className="text-xs font-bold text-gray-500">
                В библиотеке клиента пока нет сохранённых шаблонов этикеток.
              </div>
              <Link
                to={`/label-designer?userId=${userDetail.id}`}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Создать первый шаблон
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {userDetail.stickerTemplates?.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group relative bg-white border border-gray-200 hover:border-blue-400 rounded-3xl overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Visual Canvas Preview Stage */}
                  <div className="relative bg-gradient-to-br from-slate-50 via-slate-100/60 to-blue-50/20 p-6 flex items-center justify-center min-h-[170px] border-b border-gray-100 overflow-hidden">
                    {/* Background grid dots pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] opacity-70 pointer-events-none" />

                    {/* Top Floating Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                      <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-blue-700 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-lg border border-blue-200/80 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        {tpl.category || 'Общая'}
                      </span>
                      <span className="font-mono text-[10px] font-bold bg-[#0F172A]/85 backdrop-blur-md text-white px-2 py-0.5 rounded-lg shadow-2xs">
                        {tpl.widthMm} × {tpl.heightMm} мм
                      </span>
                    </div>

                    {/* Realistic Sticker Canvas */}
                    <div className="z-0 my-2">
                      <StickerCanvasPreview
                        widthMm={tpl.widthMm || 58}
                        heightMm={tpl.heightMm || 40}
                        elements={Array.isArray(tpl.elements) ? tpl.elements : []}
                        scale={2.2}
                        previewData={{
                          gtin: '04601234567890',
                          serial: 'TB-DEMO-01',
                          productName: tpl.name,
                          category: tpl.category || '',
                        }}
                        className="shadow-md rounded-xs border border-black/80"
                      />
                    </div>
                  </div>

                  {/* Card Info & Actions */}
                  <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                    <div className="space-y-2">
                      <h3
                        className="font-extrabold text-sm text-[#111827] group-hover:text-[#0082FB] transition-colors line-clamp-2 leading-snug"
                        title={tpl.name}
                      >
                        {tpl.name}
                      </h3>

                      <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-0.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Layers className="w-3.5 h-3.5 text-gray-400" />
                          {Array.isArray(tpl.elements) ? `${tpl.elements.length} элементов` : '0 элементов'}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(tpl.updatedAt || tpl.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                      <Link
                        to={`/label-designer?userTemplateId=${tpl.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-[#111827] hover:bg-[#0082FB] text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-98"
                      >
                        <Palette className="w-3.5 h-3.5 text-blue-300" />
                        <span>В конструктор</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                        disabled={deletingTemplateId === tpl.id}
                        title="Удалить этот шаблон"
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 hover:border-red-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Top-Right Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        {saveSuccessMsg && (
          <div className="pointer-events-auto bg-[#0F172A] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="leading-snug">{saveSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessMsg(null)}
              className="text-gray-400 hover:text-white font-bold p-1 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {templateActionMsg && (
          <div className="pointer-events-auto bg-[#0F172A] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="leading-snug">{templateActionMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setTemplateActionMsg(null)}
              className="text-gray-400 hover:text-white font-bold p-1 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {saveErrorMsg && (
          <div className="pointer-events-auto bg-red-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-200 shrink-0" />
              <span className="leading-snug">{saveErrorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveErrorMsg(null)}
              className="text-red-200 hover:text-white font-bold p-1 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserDetailPage;
