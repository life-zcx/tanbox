import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, CheckCircle2 } from 'lucide-react';
import { TariffCode } from '../../types';
import { apiClient } from '../../api/client';
import { getLkUrl } from '../../utils/navigation';
import { useLanguage } from '../../context/LanguageContext';

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
  const { lang, getLocalizedPath } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);
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
    if (!consent) {
      alert(
        lang === 'kz'
          ? 'Дербес деректерді өңдеуге келісіміңізді растаңыз (ҚР № 94-V Заңы).'
          : lang === 'en'
          ? 'Please confirm consent to personal data processing (RK Law No. 94-V).'
          : 'Пожалуйста, подтвердите согласие на обработку персональных данных (Закон РК № 94-V).'
      );
      return;
    }
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
            <div className="w-16 h-16 bg-[#0082FB] text-white rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-black">
              {lang === 'kz'
                ? 'Тапсырыс сәтті жіберілді!'
                : lang === 'en'
                ? 'Order successfully submitted!'
                : 'Заявка успешно отправлена!'}
            </h3>
            <p className="text-sm text-gray-600">
              {lang === 'kz' ? (
                <>
                  Біздің таңбалау жөніндегі менеджеріміз қоймаға шығуды растау үшін 15 минут ішінде{' '}
                  <span className="font-bold text-black">{form.phone}</span> нөмірі бойынша хабарласады.
                </>
              ) : lang === 'en' ? (
                <>
                  Our serialization operations specialist will call you at{' '}
                  <span className="font-bold text-black">{form.phone}</span> within 15 minutes to confirm the schedule.
                </>
              ) : (
                <>
                  Наш менеджер по маркировке свяжется с вами по номеру{' '}
                  <span className="font-bold text-black">{form.phone}</span> в течение 15 минут для подтверждения выезда.
                </>
              )}
            </p>
            <div className="pt-4">
              <a
                href={getLkUrl('/orders')}
                className="inline-block bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm px-6 py-3 rounded-xl transition-all shadow-md"
              >
                {lang === 'kz'
                  ? 'lk.tanbox.kz жеке кабинетіне өту'
                  : lang === 'en'
                  ? 'Proceed to lk.tanbox.kz Client Portal'
                  : 'Перейти в личный кабинет lk.tanbox.kz'}
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-black">
                {lang === 'kz' ? 'Тапсырысты растау' : lang === 'en' ? 'Order Confirmation' : 'Подтверждение заказа'}
              </h3>
              <p className="text-xs text-gray-500">
                {lang === 'kz'
                  ? 'Шот пен шартты қалыптастыру үшін компанияңыздың деректемелерін көрсетіңіз'
                  : lang === 'en'
                  ? 'Please specify company details for invoicing and SLA preparation'
                  : 'Укажите реквизиты вашей компании для формирования счета'}
              </p>
            </div>

            {/* Calculated Order Summary Badge */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex justify-between items-center text-sm font-semibold">
              <div>
                <span className="text-xs text-gray-500 uppercase block font-bold">
                  {lang === 'kz' ? 'Тариф және көлемі' : lang === 'en' ? 'Tariff & Volume' : 'Тариф и объем'}
                </span>
                <span className="text-black font-extrabold">
                  {tariffType} • {itemsCount.toLocaleString()} {lang === 'kz' ? 'дана' : lang === 'en' ? 'pcs' : 'шт.'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 uppercase block font-bold">
                  {lang === 'kz' ? 'Алдын ала құны' : lang === 'en' ? 'Estimated Total' : 'Предварительно'}
                </span>
                <span className="text-xl font-black text-[#0082FB]">{totalPrice.toLocaleString()} ₸</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-black uppercase mb-1 block">
                  {lang === 'kz' ? 'Компания атауы / ЖК' : lang === 'en' ? 'Company Name / Sole Proprietor' : 'Название компании / ИП'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'kz' ? 'Ұйым атауын енгізіңіз' : lang === 'en' ? 'Enter company name' : 'Введите наименование организации'}
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-black uppercase mb-1 block">
                  {lang === 'kz' ? 'БСН / ЖСН (ҚР)' : lang === 'en' ? 'BIN / IIN (KZ)' : 'БИН / ИИН (РК)'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  placeholder={lang === 'kz' ? 'БСН / ЖСН енгізіңіз' : lang === 'en' ? 'Enter BIN / IIN' : 'Введите БИН / ИИН'}
                  value={form.binIin}
                  onChange={(e) => setForm({ ...form, binIin: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-black uppercase mb-1 block">
                  {lang === 'kz' ? 'Жауапты тұлғаның телефоны' : lang === 'en' ? 'Contact Phone' : 'Телефон ответственного'}
                </label>
                <input
                  type="tel"
                  required
                  placeholder={lang === 'kz' ? 'Телефон нөмірін енгізіңіз' : lang === 'en' ? 'Enter phone number' : 'Введите номер телефона'}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-black uppercase mb-1 block">
                  {lang === 'kz' ? 'Партияға ескертпе (міндетті емес)' : lang === 'en' ? 'Batch notes (optional)' : 'Примечание к партии (необязательно)'}
                </label>
                <textarea
                  rows={2}
                  placeholder={lang === 'kz' ? 'Мысалы: Алматы қаласындағы қойма, сенбі күні шығу қажет' : lang === 'en' ? 'e.g., Almaty warehouse, weekend dispatch required' : 'Например: Склад в г. Алматы, требуется выезд в субботу'}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-sm font-semibold text-black focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              {/* Personal Data Consent Checkbox (Закон РК № 94-V) */}
              <div className="flex items-start gap-2 pt-1 text-left">
                <input
                  type="checkbox"
                  id="quick-consent"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0082FB] focus:ring-[#0082FB] cursor-pointer shrink-0"
                />
                <label htmlFor="quick-consent" className="text-xs text-gray-500 leading-relaxed cursor-pointer select-none">
                  {lang === 'kz' ? (
                    <>
                      Мен{' '}
                      <Link to={getLocalizedPath('/privacy')} target="_blank" className="text-[#0082FB] font-bold underline">
                        Құпиялылық саясатына
                      </Link>{' '}
                      сәйкес дербес деректерді жинау мен өңдеуге келісім беремін.
                    </>
                  ) : lang === 'en' ? (
                    <>
                      I consent to the collection and processing of personal data pursuant to the{' '}
                      <Link to={getLocalizedPath('/privacy')} target="_blank" className="text-[#0082FB] font-bold underline">
                        Privacy Policy
                      </Link>.
                    </>
                  ) : (
                    <>
                      Я согласен на сбор и обработку персональных данных в соответствии с{' '}
                      <Link to={getLocalizedPath('/privacy')} target="_blank" className="text-[#0082FB] font-bold underline">
                        Политикой конфиденциальности РК
                      </Link>.
                    </>
                  )}
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-3.5 rounded-xl transition-all active:scale-95 shadow-md mt-2 cursor-pointer"
              >
                {lang === 'kz'
                  ? 'Таңбалауға өтінім беру'
                  : lang === 'en'
                  ? 'Submit Serialization Request'
                  : 'Отправить заявку на маркировку'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>,
    document.body
  );
};
