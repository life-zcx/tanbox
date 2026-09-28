import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';
import { ContactsSection } from '../components/landing/ContactsSection';
import { COMPANY_CONTACTS } from '../data/companyContacts';

export const ContactsPage: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [binIin, setBinIin] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rate Limiting (60 seconds cooldown)
  const COOLDOWN_MS = 60 * 1000;
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(() => {
    try {
      const storedUntil = localStorage.getItem('tanbox_lead_cooldown_until');
      if (storedUntil) {
        const remaining = Math.ceil((parseInt(storedUntil, 10) - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
      }
    } catch {}
    return 0;
  });

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          try {
            localStorage.removeItem('tanbox_lead_cooldown_until');
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Field validation error states
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [binError, setBinError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<boolean>(false);

  // Phone Auto-Formatter (+7 (7XX) XXX-XX-XX)
  const formatKazakhPhone = (value: string): string => {
    let digits = value.replace(/\D/g, '');

    if (digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    }
    if (!digits.startsWith('7') && digits.length > 0) {
      digits = '7' + digits;
    }

    // Strictly limit to 11 digits (+7 + 10 digits)
    digits = digits.slice(0, 11);

    if (digits.length === 0) return '';
    if (digits.length <= 1) return '+7';
    if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
    if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const validatePhone = (val: string): boolean => {
    const digitsOnly = val.replace(/\D/g, '');
    if (!val.trim()) {
      setPhoneError('Укажите контактный номер телефона');
      return false;
    }
    if (digitsOnly.length !== 11) {
      setPhoneError('Номер должен содержать 11 цифр (+7 7XX XXX-XX-XX)');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const validateEmail = (val: string): boolean => {
    if (!val.trim()) {
      setEmailError(null);
      return true; // Optional field
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      setEmailError('Некорректный e-mail (пример: info@company.kz)');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validateBinIin = (val: string): boolean => {
    if (!val.trim()) {
      setBinError(null);
      return true; // Optional field
    }
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length !== 12 || val.trim().length !== 12) {
      setBinError('БИН/ИИН должен состоять ровно из 12 цифр');
      return false;
    }
    setBinError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cooldownSeconds > 0) {
      setSubmitted(false);
      setError(`Вы уже отправили заявку. Пожалуйста, подождите ${cooldownSeconds} сек. перед повторной отправкой.`);
      return;
    }

    if (!consent) {
      setConsentError(true);
      return;
    }

    const isPhoneValid = validatePhone(phone);
    const isEmailValid = validateEmail(email);
    const isBinValid = validateBinIin(binIin);

    if (!isPhoneValid || !isEmailValid || !isBinValid) {
      setError('Пожалуйста, проверьте правильность заполнения полей.');
      return;
    }

    setLoading(true);

    const leadObject = {
      id: `lead-${Date.now()}`,
      serviceTitle: 'Запрос с формы контактов (Консультация)',
      companyName,
      phone,
      email: email || undefined,
      binIin: binIin || undefined,
      notes: notes || undefined,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save locally
    try {
      const existing = JSON.parse(localStorage.getItem('tanbox_service_leads') || '[]');
      localStorage.setItem('tanbox_service_leads', JSON.stringify([leadObject, ...existing]));
    } catch (err) {
      console.error('LocalStorage save error:', err);
    }

    // 2. Post to backend REST API
    try {
      await apiClient.post('/leads', {
        serviceTitle: 'Запрос с формы контактов (Консультация)',
        companyName,
        phone,
        email: email || undefined,
        binIin: binIin || undefined,
        notes: notes || undefined,
      });
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError('Слишком много запросов. Пожалуйста, подождите немного.');
        setLoading(false);
        return;
      }
      console.warn('Backend API submission warning (saved locally):', err);
    } finally {
      setSubmitted(true);
      setLoading(false);

      // Start 60-second rate-limit cooldown
      const cooldownUntil = Date.now() + COOLDOWN_MS;
      try {
        localStorage.setItem('tanbox_lead_cooldown_until', cooldownUntil.toString());
      } catch {}
      setCooldownSeconds(60);

      // Reset form fields
      setCompanyName('');
      setPhone('');
      setEmail('');
      setBinIin('');
      setNotes('');
    }
  };

  return (
    <div className="bg-[#F4F6F9] min-h-screen pb-16 space-y-8">
      
      {/* Header Banner */}
      <section className="relative py-12 sm:py-16 bg-white border-b border-gray-200/80 overflow-hidden">
        {/* Subtle grid pattern & ambient tint */}
        <div className="absolute inset-0 bg-[radial-gradient(#0082FB_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0082FB]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight max-w-4xl">
            Контакты и Реквизиты
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-3xl font-normal leading-relaxed">
            Официальный отдел продаж и центр обслуживания клиентов ИС Танба в Республике Казахстан.
          </p>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Telegram & Email quick contact cards from tanba.telecom.kz (Image 1) */}
        <ContactsSection showTitle={false} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Info Side */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-8 shadow-sm space-y-8">
            <h3 className="text-xl font-bold text-[#111827]">{COMPANY_CONTACTS.officeTitle}</h3>

            <div className="space-y-6 text-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#EBF5FF] text-[#0082FB] rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#111827] text-xs uppercase tracking-wider">Адрес головного офиса</p>
                  <p className="text-[#64748B] mt-1">{COMPANY_CONTACTS.address.full}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#EBF5FF] text-[#0082FB] rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#111827] text-xs uppercase tracking-wider">Горячая линия (24/7)</p>
                  <p className="mt-1">
                    <a href={`tel:${COMPANY_CONTACTS.phones.hotlineRaw}`} className="text-[#111827] font-bold hover:text-[#0082FB] transition-colors block">
                      {COMPANY_CONTACTS.phones.hotline}
                    </a>
                  </p>
                  <p className="text-[#64748B] mt-0.5">
                    <a href={`tel:${COMPANY_CONTACTS.phones.mobileRaw}`} className="hover:text-[#0082FB] transition-colors">
                      {COMPANY_CONTACTS.phones.mobile} {COMPANY_CONTACTS.phones.mobileNote}
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#EBF5FF] text-[#0082FB] rounded-full flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#111827] text-xs uppercase tracking-wider">Электронная почта</p>
                  <p className="text-[#64748B] mt-1">
                    <a href={`mailto:${COMPANY_CONTACTS.emails.info}`} className="hover:text-[#0082FB] transition-colors">
                      {COMPANY_CONTACTS.emails.displayCombined}
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#EBF5FF] text-[#0082FB] rounded-full flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#111827] text-xs uppercase tracking-wider">График работы мобильных бригад</p>
                  <p className="text-[#64748B] mt-1">{COMPANY_CONTACTS.workingHours.full}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-xs font-bold uppercase text-[#111827] mb-2">Юридические реквизиты:</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {COMPANY_CONTACTS.legal.companyName}<br />
                БИН: {COMPANY_CONTACTS.legal.bin}<br />
                ИИК: {COMPANY_CONTACTS.legal.iik} в {COMPANY_CONTACTS.legal.bank}
              </p>
            </div>

          </div>

          {/* Form Side */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-bold text-[#111827]">Написать в отдел маркировки</h3>
              <p className="text-sm text-[#64748B] mt-1">Оставьте запрос на КП или коммерческий расчет партии товара.</p>
            </div>

            {submitted && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-900">Заявка успешно отправлена</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Спасибо! Мы получили ваше обращение и свяжемся с вами в ближайшее время.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-semibold border border-red-200">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
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
                <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1 flex items-center justify-between">
                  <span>Контактный телефон <span className="text-red-500">*</span></span>
                  {phoneError && <span className="text-red-500 text-[10px] font-normal normal-case">{phoneError}</span>}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onFocus={() => {
                    if (!phone) setPhone('+7 (7');
                  }}
                  onChange={(e) => {
                    const formatted = formatKazakhPhone(e.target.value);
                    setPhone(formatted);
                    if (phoneError) validatePhone(formatted);
                  }}
                  onBlur={(e) => validatePhone(e.target.value)}
                  placeholder="+7 (701) 000-0000"
                  maxLength={18}
                  className={`w-full bg-[#F4F6F9] border rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none transition-colors ${
                    phoneError ? 'border-red-500 focus:border-red-500' : 'border-gray-200/80 focus:border-[#0082FB]'
                  }`}
                />
              </div>

              {/* Grid: Email & BIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1 flex items-center justify-between">
                    <span>E-mail</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={(e) => validateEmail(e.target.value)}
                    placeholder="info@company.kz"
                    className={`w-full bg-[#F4F6F9] border rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none transition-colors ${
                      emailError ? 'border-red-500 focus:border-red-500' : 'border-gray-200/80 focus:border-[#0082FB]'
                    }`}
                  />
                  {emailError && <p className="text-red-500 text-[10px] mt-1">{emailError}</p>}
                </div>

                <div>
                  <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1 flex items-center justify-between">
                    <span>БИН / ИИН (12 цифр)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={binIin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setBinIin(val);
                      if (binError) validateBinIin(val);
                    }}
                    onBlur={(e) => validateBinIin(e.target.value)}
                    placeholder="123456789012"
                    className={`w-full bg-[#F4F6F9] border rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none transition-colors ${
                      binError ? 'border-red-500 focus:border-red-500' : 'border-gray-200/80 focus:border-[#0082FB]'
                    }`}
                  />
                  {binError && <p className="text-red-500 text-[10px] mt-1">{binError}</p>}
                </div>
              </div>

              {/* Comment / Notes */}
              <div>
                <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1">
                  Комментарий / Пожелания
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Объем партии, сроки, адрес склада..."
                  className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl p-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              {/* Personal Data Consent Checkbox (Закон РК № 94-V) */}
              <div
                className={`flex items-start gap-2.5 pt-1 p-2 rounded-xl transition-all ${
                  consentError ? 'bg-red-50/80 border border-red-300 ring-1 ring-red-200' : 'border border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  id="contact-consent"
                  required
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (e.target.checked) {
                      setConsentError(false);
                    }
                  }}
                  className={`mt-0.5 h-4 w-4 rounded cursor-pointer transition-colors ${
                    consentError
                      ? 'border-red-500 text-red-600 focus:ring-red-400'
                      : 'border-gray-300 text-[#0082FB] focus:ring-[#0082FB]'
                  }`}
                />
                <label
                  htmlFor="contact-consent"
                  className={`text-xs leading-relaxed cursor-pointer select-none transition-colors ${
                    consentError ? 'text-red-700 font-semibold' : 'text-[#64748B]'
                  }`}
                >
                  Я даю согласие на сбор и обработку персональных данных в соответствии с{' '}
                  <Link
                    to="/privacy"
                    target="_blank"
                    className={`font-semibold underline underline-offset-2 ${
                      consentError ? 'text-red-800' : 'text-[#0082FB]'
                    }`}
                  >
                    Политикой конфиденциальности
                  </Link>{' '}
                  и Законом РК № 94-V «О персональных данных и их защите».
                </label>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm px-8 py-3.5 rounded-xl transition-all active:scale-95 shadow-md shadow-[#0082FB]/25 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Отправка...
                    </>
                  ) : (
                    <>
                      Отправить заявку <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
