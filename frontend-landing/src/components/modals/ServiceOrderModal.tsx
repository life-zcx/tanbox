import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

interface ServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceTitle?: string;
}

const SERVICE_OPTIONS = [
  'Таможенное оформление и растаможка грузов',
  'Заведение товаров в НКТ (Каталог товаров)',
  'Эмиссия и нанесение кодов Data Matrix',
  'Агрегация в короба и паллеты (SSCC)',
  'Выездные мобильные бригады оклейщиков (24/7)',
  'Интеграция ИС Танба с 1С / ERP и Консалтинг',
  'Другой вопрос / Комплексный аудит',
];

export const ServiceOrderModal: React.FC<ServiceOrderModalProps> = ({
  isOpen,
  onClose,
  initialServiceTitle = SERVICE_OPTIONS[0],
}) => {
  const [selectedService, setSelectedService] = useState(initialServiceTitle);
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [binIin, setBinIin] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialServiceTitle) {
      setSelectedService(initialServiceTitle);
    }
  }, [initialServiceTitle]);

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
    setLoading(true);
    setError(null);

    const leadObject = {
      id: `lead-${Date.now()}`,
      serviceTitle: selectedService,
      companyName,
      phone,
      email: email || undefined,
      binIin: binIin || undefined,
      notes: notes || undefined,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save to local storage for instant availability across tabs
    try {
      const existing = JSON.parse(localStorage.getItem('tanbox_service_leads') || '[]');
      localStorage.setItem('tanbox_service_leads', JSON.stringify([leadObject, ...existing]));
    } catch (err) {
      console.error('LocalStorage save error:', err);
    }

    // 2. Post to backend REST API
    try {
      await apiClient.post('/leads', {
        serviceTitle: selectedService,
        companyName,
        phone,
        email: email || undefined,
        binIin: binIin || undefined,
        notes: notes || undefined,
      });
    } catch (err) {
      console.warn('Backend API submission warning (saved locally):', err);
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setCompanyName('');
    setPhone('');
    setEmail('');
    setBinIin('');
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-gray-100 text-gray-400 hover:text-[#111827] hover:bg-gray-200 flex items-center justify-center transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-[#EBF5FF] text-[#0082FB] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-[#111827]">
                Заявка успешно принята!
              </h3>
              <p className="text-sm text-[#64748B] max-w-md mx-auto font-normal leading-relaxed">
                Наш профильный специалист по услуге <span className="font-bold text-[#111827]">«{selectedService}»</span> свяжется с вами по номеру <span className="font-mono font-bold text-[#0082FB]">{phone}</span> в течение 15 минут.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-md shadow-[#0082FB]/25 active:scale-95"
              >
                Отлично, закрыть окно
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1 pr-6">
              <h3 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                Заказать услугу
              </h3>
              <p className="text-xs text-[#64748B]">
                Заполните контактные данные для первичной консультации и расчета стоимости
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-semibold border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Selected Service Dropdown */}
              <div>
                <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1">
                  Услуга
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0082FB] cursor-pointer"
                >
                  {SERVICE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company / Name */}
              <div>
                <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1">
                  Наименование компании / ФИО <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder='Например: ТОО "Казахстан Трейд" или Иван Иванов'
                  className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1">
                  Контактный телефон <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (701) 000-0000"
                  className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              {/* Grid: Email & BIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1">
                    E-mail (необязательно)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@company.kz"
                    className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1">
                    БИН / ИИН (необязательно)
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={binIin}
                    onChange={(e) => setBinIin(e.target.value)}
                    placeholder="12 знаков"
                    className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1">
                  Комментарий / Пожелания
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Объем партии, сроки, адрес склада..."
                  className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl p-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-3.5 rounded-xl transition-all active:scale-95 shadow-md shadow-[#0082FB]/25 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Обработка...
                  </>
                ) : (
                  <>
                    Отправить заявку <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          </>
        )}

      </div>
    </div>
  );
};
