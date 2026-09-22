import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Building2, Phone, Mail, MapPin, Save, Edit3, Plus, Trash2, Star, Check,
  Lock, KeyRound, Eye, EyeOff, CheckCircle, AlertCircle, Clock, Calendar, User, X,
  ShieldCheck, ArrowUpRight
} from 'lucide-react';

import { PageHeader } from '@shared';

export interface WarehouseAddress {
  id: string;
  name: string;
  city: string;
  address: string;
  warehouseContact: string;
  warehousePhone: string;
  selectedDays: string[];
  startTime: string;
  endTime: string;
  isPrimary?: boolean;
}

export const KZ_CITIES = [
  'г. Алматы',
  'г. Астана',
  'г. Шымкент',
  'г. Караганда',
  'г. Актобе',
  'г. Тараз',
  'г. Павлодар',
  'г. Усть-Каменогорск',
  'г. Семей',
  'г. Атырау',
  'г. Костанай',
  'г. Кызылорда',
  'г. Уральск',
  'г. Петропавловск',
  'г. Актау',
  'г. Туркестан',
  'г. Кокшетау',
  'г. Талдыкорган',
  'г. Экибастуз',
  'г. Жанаозен'
];

export const DAYS_OF_WEEK = [
  { id: 'Пн', full: 'Понедельник' },
  { id: 'Вт', full: 'Вторник' },
  { id: 'Ср', full: 'Среда' },
  { id: 'Чт', full: 'Четверг' },
  { id: 'Пт', full: 'Пятница' },
  { id: 'Сб', full: 'Суббота' },
  { id: 'Вс', full: 'Воскресенье' },
];

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const INITIAL_WAREHOUSES: WarehouseAddress[] = [];

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  // Company profile edit state with localStorage persistence
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyPhone, setCompanyPhone] = useState(() => {
    return localStorage.getItem('tanbox_company_phone') || user?.phone || '';
  });
  const [companySaved, setCompanySaved] = useState(false);

  // Multi-warehouse list state with localStorage persistence
  const [warehouses, setWarehouses] = useState<WarehouseAddress[]>(() => {
    const saved = localStorage.getItem('tanbox_warehouses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const saveWarehousesList = (newList: WarehouseAddress[]) => {
    setWarehouses(newList);
    localStorage.setItem('tanbox_warehouses', JSON.stringify(newList));
  };

  // Warehouse Modal state (for adding/editing)
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWhId, setEditingWhId] = useState<string | null>(null);

  // Modal form states
  const [whName, setWhName] = useState('');
  const [whCity, setWhCity] = useState('г. Алматы');
  const [whAddress, setWhAddress] = useState('');
  const [whContact, setWhContact] = useState('');
  const [whPhone, setWhPhone] = useState('');
  const [whDays, setWhDays] = useState<string[]>(['Пн', 'Вт', 'Ср', 'Чт', 'Пт']);
  const [whStart, setWhStart] = useState('09:00');
  const [whEnd, setWhEnd] = useState('18:00');

  // Password Modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isWarehouseModalOpen || isPasswordModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isWarehouseModalOpen, isPasswordModalOpen]);

  // Company edit submit
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('tanbox_company_phone', companyPhone);
    setIsEditingCompany(false);
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 3000);
  };

  // Open Warehouse Modal (for add or edit)
  const handleOpenWarehouseModal = (wh?: WarehouseAddress) => {
    if (wh) {
      setEditingWhId(wh.id);
      setWhName(wh.name);
      setWhCity(wh.city);
      setWhAddress(wh.address);
      setWhContact(wh.warehouseContact);
      setWhPhone(wh.warehousePhone);
      setWhDays(wh.selectedDays);
      setWhStart(wh.startTime);
      setWhEnd(wh.endTime);
    } else {
      setEditingWhId(null);
      setWhName(`Склад №${warehouses.length + 1}`);
      setWhCity('г. Алматы');
      setWhAddress('');
      setWhContact('');
      setWhPhone(companyPhone || user?.phone || '');
      setWhDays(['Пн', 'Вт', 'Ср', 'Чт', 'Пт']);
      setWhStart('09:00');
      setWhEnd('18:00');
    }
    setIsWarehouseModalOpen(true);
  };

  // Save Warehouse Modal
  const handleSaveWarehouseModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWhId) {
      const updated = warehouses.map((w) =>
        w.id === editingWhId
          ? {
              ...w,
              name: whName,
              city: whCity,
              address: whAddress,
              warehouseContact: whContact,
              warehousePhone: whPhone,
              selectedDays: whDays,
              startTime: whStart,
              endTime: whEnd,
            }
          : w
      );
      saveWarehousesList(updated);
    } else {
      const newWh: WarehouseAddress = {
        id: `wh-${Date.now()}`,
        name: whName || `Склад №${warehouses.length + 1}`,
        city: whCity,
        address: whAddress,
        warehouseContact: whContact,
        warehousePhone: whPhone,
        selectedDays: whDays,
        startTime: whStart,
        endTime: whEnd,
        isPrimary: warehouses.length === 0,
      };
      saveWarehousesList([...warehouses, newWh]);
    }
    setIsWarehouseModalOpen(false);
  };

  // Toggle day in modal
  const toggleWhDay = (dayId: string) => {
    if (whDays.includes(dayId)) {
      if (whDays.length === 1) return;
      setWhDays(whDays.filter((d) => d !== dayId));
    } else {
      setWhDays([...whDays, dayId]);
    }
  };

  // Toggle Primary Warehouse
  const handleSetPrimary = (whId: string) => {
    const updated = warehouses.map((w) => ({
      ...w,
      isPrimary: w.id === whId,
    }));
    saveWarehousesList(updated);
  };

  // Delete Warehouse
  const handleDeleteWarehouse = (whId: string) => {
    const remaining = warehouses.filter((w) => w.id !== whId);
    saveWarehousesList(remaining);
  };

  // Submit Password Change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword) {
      setPasswordStatus({ type: 'error', message: 'Введите текущий пароль' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Новый пароль должен содержать не менее 6 символов' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Новый пароль и подтверждение не совпадают' });
      return;
    }

    setPasswordLoading(true);
    setTimeout(() => {
      setPasswordLoading(false);
      setPasswordStatus({ type: 'success', message: 'Пароль успешно изменен!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordStatus(null);
        setIsPasswordModalOpen(false);
      }, 1800);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Профиль компании"
        description="Управление данными организации, адресами складов и настройками безопасности"
      />

      {/* CARD 1: USER / COMPANY HEADER CARD (Как на макете) */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
            <User className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-black">{user?.companyName || 'Организация'}</h2>
            <p className="text-xs font-semibold text-gray-500">{user?.email || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsEditingCompany(!isEditingCompany)}
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 hover:text-black hover:bg-gray-200 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditingCompany ? 'ОТМЕНА' : 'РЕДАКТИРОВАТЬ'}
          </button>
        </div>
      </div>

      {/* CARD 2: ЛИЧНЫЕ ДАННЫЕ (Как на макете) */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
        <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">
          ЛИЧНЫЕ ДАННЫЕ
        </h3>

        <form onSubmit={handleSaveCompany} className="space-y-4">
          {/* ИМЯ / НАИМЕНОВАНИЕ */}
          <div>
            <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1.5">
              НАИМЕНОВАНИЕ КОМПАНИИ
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="text"
                disabled
                value={user?.companyName || ''}
                className="w-full bg-gray-50 border border-gray-200/60 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-black cursor-not-allowed"
              />
            </div>
          </div>

          {/* БИН / ИИН */}
          <div>
            <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1.5">
              БИН / ИИН (РК)
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="text"
                disabled
                value={user?.binIin || ''}
                className="w-full bg-gray-50 border border-gray-200/60 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-black font-mono cursor-not-allowed"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1.5">
              EMAIL (НЕЛЬЗЯ ИЗМЕНИТЬ)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-gray-50 border border-gray-200/60 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-black cursor-not-allowed"
              />
            </div>
          </div>

          {/* ТЕЛЕФОН */}
          <div>
            <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1.5">
              ТЕЛЕФОН
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="tel"
                disabled={!isEditingCompany}
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className={`w-full border rounded-2xl pl-11 pr-4 py-3 text-sm font-bold transition-all ${
                  isEditingCompany
                    ? 'bg-white border-black text-black shadow-sm'
                    : 'bg-gray-50 border-gray-200/60 text-black cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {isEditingCompany && (
            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                className="bg-black text-white text-xs font-extrabold px-6 py-3 rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-95"
              >
                Сохранить телефон
              </button>
            </div>
          )}

          {companySaved && (
            <span className="text-xs font-extrabold text-emerald-600 block">
              Данные сохранены!
            </span>
          )}
        </form>
      </div>

      {/* CARD 3: АДРЕСА ДОСТАВКИ / АДРЕСА СКЛАДОВ (Как на макете) */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        
        {/* Card Header with Blue "+ Добавить адрес" Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black uppercase tracking-wide">
                АДРЕСА СКЛАДОВ
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Управляйте сохраненными адресами складов для выезда стикеровщиков
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenWarehouseModal()}
            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600" /> Добавить адрес
          </button>
        </div>

        {/* Addresses List */}
        {warehouses.length === 0 ? (
          <div className="text-center py-8 px-4 bg-gray-50/60 border border-dashed border-gray-200 rounded-2xl space-y-3">
            <MapPin className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">Адреса складов пока не добавлены</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Нажмите «+ Добавить адрес», чтобы внести адрес вашего склада и контакты для выезда бригад маркировки.
            </p>
            <button
              type="button"
              onClick={() => handleOpenWarehouseModal()}
              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-extrabold px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-600" /> Добавить первый адрес
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {warehouses.map((wh) => (
              <div
                key={wh.id}
                className="bg-gray-50/60 border border-gray-200/70 hover:border-gray-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-black">
                        {wh.city}, {wh.address || 'Адрес не указан'}
                      </span>
                      {wh.isPrimary && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                          ОСНОВНОЙ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      {wh.name} • {wh.warehouseContact || 'Без контактов'} • {wh.warehousePhone} • {wh.selectedDays.join(', ')} ({wh.startTime}-{wh.endTime})
                    </p>
                  </div>
                </div>

                {/* Action Icons (Star / Edit / Trash) */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(wh.id)}
                    title={wh.isPrimary ? 'Основной адрес' : 'Сделать основным'}
                    className={`p-2 rounded-xl transition-all ${
                      wh.isPrimary
                        ? 'text-amber-500 bg-amber-50'
                        : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${wh.isPrimary ? 'fill-amber-500' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenWarehouseModal(wh)}
                    title="Редактировать склад"
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {warehouses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteWarehouse(wh.id)}
                      title="Удалить адрес"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* CARD 4: БЕЗОПАСНОСТЬ (Как на макете) */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-black">Безопасность</h3>
            <p className="text-xs text-gray-400 font-medium">
              Смена пароля (требуется текущий пароль)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPasswordModalOpen(true)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 hover:text-black text-xs font-extrabold px-6 py-3.5 rounded-xl transition-all uppercase tracking-wider shrink-0 cursor-pointer active:scale-95"
        >
          ИЗМЕНИТЬ ПАРОЛЬ
        </button>
      </div>

      {/* MODAL WINDOW FOR ADDING / EDITING WAREHOUSE */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-black">
                  {editingWhId ? 'Редактировать адрес склада' : 'Добавить новый склад'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWarehouseModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-black hover:bg-gray-200 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWarehouseModal} className="space-y-4">
              
              {/* Название склада */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1.5">
                  Название склада
                </label>
                <input
                  type="text"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="Например: Основной склад, Склад №2"
                  required
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold text-black focus:outline-none focus:border-black"
                />
              </div>

              {/* Город */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1.5">
                  Город
                </label>
                <select
                  value={whCity}
                  onChange={(e) => setWhCity(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold text-black focus:outline-none focus:border-black"
                >
                  {KZ_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Улица / Точный адрес */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1.5">
                  Основной адрес склада
                </label>
                <input
                  type="text"
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  placeholder="Улица, дом, складской комплекс..."
                  required
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold text-black focus:outline-none focus:border-black"
                />
              </div>

              {/* Ответственное лицо & Телефон */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase block mb-1.5">
                    Ответственное лицо
                  </label>
                  <input
                    type="text"
                    value={whContact}
                    onChange={(e) => setWhContact(e.target.value)}
                    placeholder="ФИО ответственного"
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-xs font-bold text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase block mb-1.5">
                    Телефон ответственного
                  </label>
                  <input
                    type="tel"
                    value={whPhone}
                    onChange={(e) => setWhPhone(e.target.value)}
                    placeholder="+7 700 000 0000"
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-xs font-bold text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Дни работы с галочками */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block mb-2">
                  Дни работы склада
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isChecked = whDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleWhDay(day.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-extrabold transition-all ${
                          isChecked
                            ? 'bg-black text-white border-black shadow-sm'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 accent-white rounded cursor-pointer"
                        />
                        <span>{day.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Время работы */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block mb-2">
                  Время работы склада
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="text-[10px] font-extrabold text-gray-400 absolute left-3 top-1.5 uppercase pointer-events-none">
                      С
                    </span>
                    <select
                      value={whStart}
                      onChange={(e) => setWhStart(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-8 pr-3 pt-5 pb-2 text-xs font-mono font-extrabold text-black"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-gray-400 font-extrabold">—</span>

                  <div className="relative flex-1">
                    <span className="text-[10px] font-extrabold text-gray-400 absolute left-3 top-1.5 uppercase pointer-events-none">
                      До
                    </span>
                    <select
                      value={whEnd}
                      onChange={(e) => setWhEnd(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-8 pr-3 pt-5 pb-2 text-xs font-mono font-extrabold text-black"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="bg-gray-100 text-gray-700 font-extrabold text-xs px-5 py-3 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-black text-white font-extrabold text-xs px-6 py-3 rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-95"
                >
                  {editingWhId ? 'Сохранить изменения' : 'Добавить склад'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL WINDOW FOR CHANGING PASSWORD */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-black">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-black">Безопасность и пароль</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-black hover:bg-gray-200 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Для защиты аккаунта используйте надежный пароль, содержащий буквы, цифры и спецсимволы.
            </p>

            {passwordStatus && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                  passwordStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {passwordStatus.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1.5">
                  Текущий пароль
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-10 py-3 text-xs font-bold text-black focus:outline-none focus:border-black transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-black transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1.5">
                  Новый пароль
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-10 py-3 text-xs font-bold text-black focus:outline-none focus:border-black transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-black transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1.5">
                  Подтвердите новый пароль
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите новый пароль"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-10 py-3 text-xs font-bold text-black focus:outline-none focus:border-black transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-black transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-black text-white font-extrabold text-xs py-3.5 rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  {passwordLoading ? 'Обновление пароля...' : 'Изменить пароль'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
