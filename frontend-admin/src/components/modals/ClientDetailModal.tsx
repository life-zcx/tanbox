import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Building2,
  Phone,
  Mail,
  Hash,
  ShieldCheck,
  Calendar,
  Package,
  Palette,
  Edit3,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Save,
  Users,
  Trash2,
  Maximize2,
  Layers,
  Clock,
} from 'lucide-react';
import { UserDetail, UserClient } from '../../types';
import { apiClient } from '../../api/client';
import { StatusBadge } from '@shared';
import { Link } from 'react-router-dom';
import { StickerCanvasPreview } from '../common/StickerCanvasPreview';
import { formatPhoneNumber, isValidPhoneNumber, getPhoneDigitsCount } from '../../utils/phone';

interface ClientDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: UserClient) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  userId,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'templates'>('profile');
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
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
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [templateActionMsg, setTemplateActionMsg] = useState<string | null>(null);

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!window.confirm(`Удалить шаблон «${templateName}» из библиотеки клиента?`)) {
      return;
    }
    setDeletingTemplateId(templateId);
    try {
      await apiClient.delete(`/user-templates/${templateId}`);
      setUserDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stickerTemplates: (prev.stickerTemplates || []).filter((t) => t.id !== templateId),
        };
      });
      setTemplateActionMsg(`Шаблон «${templateName}» успешно удален`);
      setTimeout(() => setTemplateActionMsg(null), 5000);
    } catch (err: any) {
      alert('Ошибка при удалении шаблона: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingTemplateId(null);
    }
  };

  useEffect(() => {
    if (!isOpen || !userId) {
      setUserDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);
      try {
        const res = await apiClient.get(`/users/${userId}`);
        const data: UserDetail = res.data;
        setUserDetail(data);

        // Populate edit form
        setCompanyName(data.companyName || '');
        setBinIin(data.binIin || '');
        setEmail(data.email || '');
        setPhone(formatPhoneNumber(data.phone || ''));
        setPhoneError(null);
        setPhoneTouched(false);
        setRole(data.role || 'CLIENT');
        setNewPassword('');
      } catch (err: any) {
        console.error('Failed to fetch user details:', err);
        setError(err.response?.data?.message || 'Не удалось загрузить данные клиента');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, userId]);

  if (!isOpen) return null;

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
    if (!userId) return;

    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    // Client-side validations
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
      setPhoneError('Введите полный номер: +7 (XXX) XXX-XX-XX');
      setSaveErrorMsg('Пожалуйста, укажите корректный 11-значный номер телефона');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        companyName: companyName.trim(),
        binIin: cleanBin,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role,
      };

      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const res = await apiClient.patch(`/users/${userId}`, payload);
      const updated: UserClient = res.data.user;

      setUserDetail((prev) => (prev ? { ...prev, ...updated } : null));
      setPhone(formatPhoneNumber(updated.phone || ''));
      setPhoneError(null);
      setPhoneTouched(false);
      onUserUpdated(updated);
      setNewPassword('');
      setSaveSuccessMsg('Данные клиента успешно сохранены!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to update user:', err);
      setSaveErrorMsg(err.response?.data?.message || 'Ошибка при сохранении данных клиента');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-[#0082FB]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-[#111827]">
                  {userDetail?.companyName || 'Карточка клиента'}
                </h2>
                {userDetail && (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      userDetail.role === 'ADMIN'
                        ? 'bg-black text-white'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {userDetail.role === 'ADMIN' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Users className="w-3.5 h-3.5" />
                    )}
                    {userDetail.role}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-[#64748B] mt-0.5 flex-wrap">
                <span className="font-mono font-bold">БИН/ИИН: {userDetail?.binIin || '—'}</span>
                <span>•</span>
                <span>ID: {userId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {userId && (
              <Link
                to={`/users/${userId}`}
                onClick={onClose}
                title="Открыть на отдельной странице"
                className="p-2 text-gray-400 hover:text-[#0082FB] hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
              >
                <Maximize2 className="w-5 h-5" />
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="text-center py-16 text-gray-400 font-bold text-sm">
              Загрузка карточки клиента...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-xs font-bold">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              {error}
            </div>
          ) : userDetail ? (
            <>
              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Заказов всего
                  </span>
                  <span className="text-lg font-black text-[#111827]">
                    {userDetail._count?.orders ?? userDetail.orders?.length ?? 0} шт.
                  </span>
                </div>

                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Сумма заказов
                  </span>
                  <span className="text-lg font-black text-emerald-600">
                    {(userDetail.totalSpent || 0).toLocaleString('ru-RU')} ₸
                  </span>
                </div>

                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Шаблонов
                  </span>
                  <span className="text-lg font-black text-[#111827]">
                    {userDetail._count?.stickerTemplates ?? userDetail.stickerTemplates?.length ?? 0} шт.
                  </span>
                </div>

                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Дата регистр.
                  </span>
                  <span className="text-xs font-bold text-[#111827] mt-1 block">
                    {new Date(userDetail.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Редактирование профиля
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  Заказы ({userDetail.orders?.length || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'templates'
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-blue-400" />
                  Шаблоны ({userDetail.stickerTemplates?.length || 0})
                </button>
              </div>

              {/* Tab 1: Edit Profile Form */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {saveSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      {saveSuccessMsg}
                    </div>
                  )}

                  {saveErrorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-bold">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      {saveErrorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block">
                        Наименование компании / ИП *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full text-xs font-bold border border-gray-300 rounded-xl p-3 focus:border-[#0082FB] focus:outline-none bg-gray-50 focus:bg-white transition-all"
                        placeholder='ТОО "Название" или ИП Фамилия'
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block">
                        БИН / ИИН (12 цифр) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={12}
                        value={binIin}
                        onChange={(e) => setBinIin(e.target.value.replace(/\D/g, ''))}
                        className="w-full font-mono text-xs font-bold border border-gray-300 rounded-xl p-3 focus:border-[#0082FB] focus:outline-none bg-gray-50 focus:bg-white transition-all"
                        placeholder="12 цифр"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block">
                        Email адрес *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs font-bold border border-gray-300 rounded-xl p-3 focus:border-[#0082FB] focus:outline-none bg-gray-50 focus:bg-white transition-all"
                        placeholder="client@company.kz"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block">
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
                              ? 'border-red-400 bg-red-50/20 text-red-900 focus:border-red-500'
                              : isValidPhoneNumber(phone)
                              ? 'border-emerald-400 bg-emerald-50/15 text-gray-900 focus:border-emerald-500'
                              : 'border-gray-300 bg-gray-50 focus:bg-white focus:border-[#0082FB]'
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
                        <p className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {phoneError}
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-400">
                          Формат: +7 (XXX) XXX-XX-XX
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block">
                        Роль в системе *
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'CLIENT' | 'ADMIN')}
                        className="w-full text-xs font-bold border border-gray-300 rounded-xl p-3 focus:border-[#0082FB] focus:outline-none bg-gray-50 focus:bg-white transition-all cursor-pointer"
                      >
                        <option value="CLIENT">CLIENT — Клиент личного кабинета</option>
                        <option value="ADMIN">ADMIN — Администратор платформы</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block flex items-center justify-between">
                        <span>Новый пароль</span>
                        <span className="text-[10px] text-gray-400 font-normal lowercase">
                          (оставьте пустым, если без изменений)
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Минимум 8 символов"
                          className="w-full text-xs font-bold border border-gray-300 rounded-xl p-3 pr-10 focus:border-[#0082FB] focus:outline-none bg-gray-50 focus:bg-white transition-all"
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
                    <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Внимание:</strong> Роль <strong>ADMIN</strong> наделяет пользователя полными правами управления платформой, заказами и другими пользователями.
                      </span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Orders List */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  {(!userDetail.orders || userDetail.orders.length === 0) ? (
                    <div className="text-center py-12 text-gray-400 text-xs font-bold bg-gray-50 rounded-2xl border border-gray-200">
                      У этого клиента пока нет оформленных заказов.
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                            <th className="py-3 px-4">№ Заказа</th>
                            <th className="py-3 px-4">Дата</th>
                            <th className="py-3 px-4">Тариф</th>
                            <th className="py-3 px-4 text-right">Объем</th>
                            <th className="py-3 px-4 text-right">Сумма</th>
                            <th className="py-3 px-4 text-center">Статус</th>
                            <th className="py-3 px-4 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {userDetail.orders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-[#111827]">
                                {ord.orderNumber}
                              </td>
                              <td className="py-3 px-4 text-gray-500">
                                {new Date(ord.createdAt).toLocaleDateString('ru-RU')}
                              </td>
                              <td className="py-3 px-4 font-bold text-gray-700">
                                {ord.tariffType}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold">
                                {ord.itemsCount.toLocaleString('ru-RU')} шт.
                              </td>
                              <td className="py-3 px-4 text-right font-black text-emerald-600">
                                {ord.totalPrice.toLocaleString('ru-RU')} ₸
                              </td>
                              <td className="py-3 px-4 text-center">
                                <StatusBadge status={ord.status} />
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Link
                                  to={`/orders/${ord.id}`}
                                  onClick={onClose}
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                                >
                                  Открыть <ExternalLink className="w-3 h-3" />
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

              {/* Tab 3: Saved Templates */}
              {activeTab === 'templates' && (
                <div className="space-y-3">
                  {templateActionMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{templateActionMsg}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTemplateActionMsg(null)}
                        className="text-emerald-700 hover:text-emerald-900 font-bold px-1 rounded cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {(!userDetail.stickerTemplates || userDetail.stickerTemplates.length === 0) ? (
                    <div className="text-center py-12 text-gray-400 text-xs font-bold bg-gray-50 rounded-2xl border border-gray-200">
                      В библиотеке клиента нет сохранённых шаблонов этикеток.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {userDetail.stickerTemplates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className="group relative bg-white border border-gray-200 hover:border-blue-400 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                        >
                          {/* Visual Canvas Preview */}
                          <div className="relative bg-gradient-to-br from-slate-50 via-slate-100/60 to-blue-50/20 p-4 flex items-center justify-center min-h-[140px] border-b border-gray-100 overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:10px_10px] opacity-60 pointer-events-none" />

                            <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                              <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-md text-blue-700 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                {tpl.category || 'Общая'}
                              </span>
                              <span className="font-mono text-[9px] font-bold bg-[#0F172A]/85 backdrop-blur-md text-white px-1.5 py-0.5 rounded shadow-2xs">
                                {tpl.widthMm} × {tpl.heightMm} мм
                              </span>
                            </div>

                            <div className="z-0 my-1">
                              <StickerCanvasPreview
                                widthMm={tpl.widthMm || 58}
                                heightMm={tpl.heightMm || 40}
                                elements={Array.isArray(tpl.elements) ? tpl.elements : []}
                                scale={1.8}
                                previewData={{
                                  gtin: '04601234567890',
                                  serial: 'TB-DEMO-01',
                                  productName: tpl.name,
                                  category: tpl.category || '',
                                }}
                                className="shadow-sm rounded-xs border border-black/70"
                              />
                            </div>
                          </div>

                          {/* Info & Actions */}
                          <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                            <div className="space-y-1">
                              <h4
                                className="font-extrabold text-xs text-[#111827] group-hover:text-[#0082FB] transition-colors line-clamp-1"
                                title={tpl.name}
                              >
                                {tpl.name}
                              </h4>
                              <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                                <span className="flex items-center gap-1">
                                  <Layers className="w-3 h-3 text-gray-400" />
                                  {Array.isArray(tpl.elements) ? `${tpl.elements.length} эл.` : '0 эл.'}
                                </span>
                                <span>{new Date(tpl.updatedAt || tpl.createdAt).toLocaleDateString('ru-RU')}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                              <Link
                                to={`/label-designer?userTemplateId=${tpl.id}`}
                                onClick={onClose}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#111827] hover:bg-[#0082FB] py-2 px-2.5 rounded-xl transition-all shadow-2xs"
                              >
                                <Palette className="w-3.5 h-3.5 text-blue-300" />
                                <span>В конструктор</span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                                disabled={deletingTemplateId === tpl.id}
                                title="Удалить этот шаблон"
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
};
