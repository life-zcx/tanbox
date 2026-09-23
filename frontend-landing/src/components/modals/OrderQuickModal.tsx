import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2 } from 'lucide-react';
import { TariffCode } from '../../types';

import { apiClient } from '../../api/client';

interface OrderQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  tariffType: TariffCode;
  itemsCount: number;
  totalPrice: number;
}

export const OrderQuickModal: React.FC<OrderQuickModalProps> = ({
  isOpen,
  onClose,
  tariffType,
  itemsCount,
  totalPrice,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    binIin: '',
    phone: '',
    notes: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const serviceTitle = `Быстрый заказ (${tariffType} • ${itemsCount.toLocaleString()} шт. • ${totalPrice.toLocaleString()} ₸)`;
    
    // 1. Save locally for instant UI update
    const leadObject = {
      id: `lead-${Date.now()}`,
      serviceTitle,
      companyName: form.companyName,
      phone: form.phone,
      binIin: form.binIin || undefined,
      notes: form.notes || undefined,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('tanbox_service_leads') || '[]');
      localStorage.setItem('tanbox_service_leads', JSON.stringify([leadObject, ...existing]));
    } catch (err) {}

    // 2. Post to backend DB
    try {
      await apiClient.post('/leads', {
        serviceTitle,
        companyName: form.companyName,
        phone: form.phone,
        binIin: form.binIin || undefined,
        notes: form.notes || undefined,
      });
    } catch (err) {
      console.warn('Backend API quick lead warning:', err);
    } finally {
      setSubmitted(true);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full p-8 relative space-y-6"
      >
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-black">Заявка успешно отправлена!</h3>
            <p className="text-sm text-gray-600">
              Наш менеджер по маркировке свяжется с вами по номеру <span className="font-bold text-black">{form.phone}</span> в течение 15 минут для подтверждения выезда.
            </p>
            <div className="pt-4">
              <a
                href="http://127.0.0.1:3001/orders"
                className="inline-block bg-black text-white font-extrabold text-sm px-6 py-3 rounded-xl hover:bg-gray-800 transition-all"
              >
                Перейти в личный кабинет lk.tanbox.kz
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-black">Подтверждение заказа</h3>
              <p className="text-xs text-gray-500">Укажите реквизиты вашей компании для формирования счета</p>
            </div>

            {/* Calculated Order Summary Badge */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex justify-between items-center text-sm font-semibold">
              <div>
                <span className="text-xs text-gray-500 uppercase block font-bold">Тариф и объем</span>
                <span className="text-black font-extrabold">{tariffType} • {itemsCount.toLocaleString()} шт.</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 uppercase block font-bold">Предварительно</span>
                <span className="text-xl font-black text-black">{totalPrice.toLocaleString()} ₸</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-black uppercase mb-1 block">Название компании / ИП</label>
                <input
                  type="text"
                  required
                  placeholder='ТОО "Казахстан Трейдинг"'
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-black uppercase mb-1 block">БИН / ИИН (РК)</label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  placeholder="980412354890"
                  value={form.binIin}
                  onChange={(e) => setForm({ ...form, binIin: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-black uppercase mb-1 block">Телефон ответственного</label>
                <input
                  type="tel"
                  required
                  placeholder="+7 701 000 0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-black uppercase mb-1 block">Примечание к партии (необязательно)</label>
                <textarea
                  rows={2}
                  placeholder="Например: Склад в г. Алматы, требуется выезд в субботу"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-sm font-semibold text-black focus:outline-none focus:border-black"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white font-extrabold text-sm py-3.5 rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-md mt-2"
              >
                Отправить заявку на маркировку
              </button>
            </form>
          </>
        )}

      </div>
    </div>,
    document.body
  );
};
