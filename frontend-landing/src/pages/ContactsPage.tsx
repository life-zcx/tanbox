import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';
import { ContactsSection } from '../components/landing/ContactsSection';
import { setPageSeo } from '../utils/seo';
import { trackGoogleConversion } from '../utils/analytics';
import { useLanguage } from '../context/LanguageContext';

export const ContactsPage: React.FC = () => {
  const { lang, getLocalizedPath } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (lang === 'kz') {
      setPageSeo(
        'Цифрлық таңбалау бірыңғай сервисінің байланыс ақпараты | TANBOX.KZ',
        'TANBOX.KZ байланыс мәліметтері. Жедел желі телефоны, онлайн-қызмет көрсету және Алматы мен Қазақстан бойынша көшпелі таңбалау бригадалары.',
        { lang: 'kz', keywords: 'байланыс tanbox, таңбалау Алматы байланыс, кеңсе мекенжайы' }
      );
    } else if (lang === 'en') {
      setPageSeo(
        'Contact Digital Product Serialization Center | TANBOX.KZ',
        'TANBOX.KZ contact information. Hotline telephone, online customer service, and onsite labeling teams in Almaty and throughout Kazakhstan.',
        { lang: 'en', keywords: 'contact tanbox, product marking office Kazakhstan' }
      );
    } else {
      setPageSeo(
        'Контакты единого сервиса цифровой маркировки | TANBOX.KZ',
        'Контакты TANBOX.KZ. Телефон горячей линии, онлайн-обслуживание и выездные бригады маркировки по Алматы и Казахстану.',
        { lang: 'ru', keywords: 'контакты tanbox, маркировка контакты Алматы' }
      );
    }
  }, [lang]);
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
      setPhoneError(
        lang === 'kz'
          ? 'Байланыс телефон нөмірін көрсетіңіз'
          : lang === 'en'
          ? 'Please enter contact phone number'
          : 'Укажите контактный номер телефона'
      );
      return false;
    }
    if (digitsOnly.length !== 11) {
      setPhoneError(
        lang === 'kz'
          ? 'Нөмір 11 саннан тұруы керек (+7 7XX XXX-XX-XX)'
          : lang === 'en'
          ? 'Phone must contain 11 digits (+7 7XX XXX-XX-XX)'
          : 'Номер должен содержать 11 цифр (+7 7XX XXX-XX-XX)'
      );
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
      setEmailError(
        lang === 'kz'
          ? 'Қате e-mail (мысалы: info@company.kz)'
          : lang === 'en'
          ? 'Invalid e-mail (e.g. info@company.kz)'
          : 'Некорректный e-mail (пример: info@company.kz)'
      );
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
      setBinError(
        lang === 'kz'
          ? 'БСН/ЖСН дәл 12 саннан тұруы тиіс'
          : lang === 'en'
          ? 'BIN/IIN must consist of exactly 12 digits'
          : 'БИН/ИИН должен состоять ровно из 12 цифр'
      );
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
      setError(
        lang === 'kz'
          ? `Сіз өтінімді жіберіп қойдыңыз. Қайта жіберу алдында ${cooldownSeconds} сек. күтіңіз.`
          : lang === 'en'
          ? `You have already sent a request. Please wait ${cooldownSeconds} sec. before retrying.`
          : `Вы уже отправили заявку. Пожалуйста, подождите ${cooldownSeconds} сек. перед повторной отправкой.`
      );
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
      setError(
        lang === 'kz'
          ? 'Өрістердің дұрыс толтырылғанын тексеріңіз.'
          : lang === 'en'
          ? 'Please verify that all fields are filled correctly.'
          : 'Пожалуйста, проверьте правильность заполнения полей.'
      );
      return;
    }

    setLoading(true);

    const leadObject = {
      id: `lead-${Date.now()}`,
      serviceTitle:
        lang === 'kz'
          ? 'Байланыс нысанынан сұраныс (Кеңес алу)'
          : lang === 'en'
          ? 'Contact Form Request (Consultation)'
          : 'Запрос с формы контактов (Консультация)',
      companyName,
      phone,
      email: email || undefined,
      binIin: binIin || undefined,
      notes: notes || undefined,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Post to backend REST API
    try {
      await apiClient.post('/leads', {
        serviceTitle:
          lang === 'kz'
            ? 'Байланыс нысанынан сұраныс (Кеңес алу)'
            : lang === 'en'
            ? 'Contact Form Request (Consultation)'
            : 'Запрос с формы контактов (Консультация)',
        companyName,
        phone,
        email: email || undefined,
        binIin: binIin || undefined,
        notes: notes || undefined,
      });
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError(
          lang === 'kz'
            ? 'Сұраныстар тым көп. Біраз күтіңіз.'
            : lang === 'en'
            ? 'Too many requests. Please wait a moment.'
            : 'Слишком много запросов. Пожалуйста, подождите немного.'
        );
        setLoading(false);
        return;
      }
      console.warn('Backend API submission warning:', err);
    } finally {
      trackGoogleConversion({ value: 1.0, currency: 'USD' });
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
      <section className="relative py-6 sm:py-8 lg:py-9 bg-white border-b border-gray-200/80 overflow-hidden">
        {/* Subtle grid pattern & ambient tint */}
        <div className="absolute inset-0 bg-[radial-gradient(#0082FB_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0082FB]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight">
              {lang === 'kz' ? 'Байланыс және Деректемелер' : lang === 'en' ? 'Contacts & Details' : 'Контакты и Реквизиты'}
            </h1>
            <p className="text-base sm:text-lg text-[#64748B] font-normal leading-relaxed">
              {lang === 'kz'
                ? 'TANBOX таңбалау орталығы — кодтарды басу, тауарларды оклейкалау және Қазақстанда «Танба» жүйесімен кілтке дейін интеграциялау.'
                : lang === 'en'
                ? 'TANBOX marking center — code printing, product labeling, and turnkey integration with IS Tanba in Kazakhstan.'
                : 'Центр маркировки TANBOX — печать кодов, оклейка товаров и интеграция с системой «Танба» под ключ в Казахстане.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-center md:justify-end self-center md:self-auto">
            <img
              src="/banners/contacts.svg"
              alt="Контакты Танбокс"
              className="w-40 sm:w-52 md:w-60 lg:w-72 h-auto max-h-36 sm:max-h-44 md:max-h-52 lg:max-h-56 object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 hover:scale-105"
              loading="eager"
            />
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Telegram & Email quick contact cards */}
        <ContactsSection showTitle={false} />

        {/* Form Container */}
        <div className="w-full bg-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm space-y-6 border border-gray-100">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#111827]">
              {lang === 'kz' ? 'Таңбалау бөліміне хабарласу' : lang === 'en' ? 'Contact Serialization Department' : 'Написать в отдел маркировки'}
            </h3>
            <p className="text-sm text-[#64748B] mt-1">
              {lang === 'kz'
                ? 'Тауар партиясын есептеу немесе коммерциялық ұсыныс алу үшін өтінім қалдырыңыз.'
                : lang === 'en'
                ? 'Request a commercial proposal or cost calculation for your product batch.'
                : 'Оставьте запрос на КП или коммерческий расчет партии товара.'}
            </p>
          </div>

          {submitted && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">
                  {lang === 'kz' ? 'Өтінім сәтті жіберілді' : lang === 'en' ? 'Request successfully submitted' : 'Заявка успешно отправлена'}
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {lang === 'kz'
                    ? 'Рақмет! Біз сіздің өтінішіңізді алдық және жақын арада хабарласамыз.'
                    : lang === 'en'
                    ? 'Thank you! We have received your inquiry and will contact you shortly.'
                    : 'Спасибо! Мы получили ваше обращение и свяжемся с вами в ближайшее время.'}
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
            {/* Grid: Company & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company / Name */}
              <div>
                <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1">
                  {lang === 'kz' ? 'Компания атауы / Т.А.Ә.' : lang === 'en' ? 'Company Name / Full Name' : 'Наименование компании / ФИО'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={lang === 'kz' ? 'Мысалы: "Қазақстан Трейд" ЖШС немесе Арман Серікұлы' : lang === 'en' ? 'e.g. "Kazakhstan Trade" LLP or John Doe' : 'Например: ТОО "Казахстан Трейд" или Иван Иванов'}
                  className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1 flex items-center justify-between">
                  <span>
                    {lang === 'kz' ? 'Байланыс телефоны' : lang === 'en' ? 'Contact Phone' : 'Контактный телефон'}{' '}
                    <span className="text-red-500">*</span>
                  </span>
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
            </div>

            {/* Grid: Email & BIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1 flex items-center justify-between">
                    <span>E-mail</span>
                  </label>
                  <input
                    type="email"
                    maxLength={100}
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
                    <span>{lang === 'kz' ? 'БСН / ЖСН (12 сан)' : lang === 'en' ? 'BIN / IIN (12 digits)' : 'БИН / ИИН (12 цифр)'}</span>
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
                  {lang === 'kz' ? 'Пікір / Қосымша мәліметтер' : lang === 'en' ? 'Comments / Requirements' : 'Комментарий / Пожелания'}
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'kz' ? 'Партия көлемі, мерзімі, қойма мекенжайы...' : lang === 'en' ? 'Batch volume, turnaround, warehouse address...' : 'Объем партии, сроки, адрес склада...'}
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
                  {lang === 'kz' ? (
                    <>
                      Мен дербес деректерді жинауға және өңдеуге келісім беремін ({' '}
                      <Link
                        to={getLocalizedPath('/privacy')}
                        target="_blank"
                        className={`font-semibold underline underline-offset-2 ${
                          consentError ? 'text-red-800' : 'text-[#0082FB]'
                        }`}
                      >
                        Құпиялылық саясаты
                      </Link>{' '}
                      және ҚР № 94-V «Дербес деректер және оларды қорғау туралы» Заңына сәйкес).
                    </>
                  ) : lang === 'en' ? (
                    <>
                      I consent to the processing of personal data in accordance with the{' '}
                      <Link
                        to={getLocalizedPath('/privacy')}
                        target="_blank"
                        className={`font-semibold underline underline-offset-2 ${
                          consentError ? 'text-red-800' : 'text-[#0082FB]'
                        }`}
                      >
                        Privacy Policy
                      </Link>{' '}
                      and Law of RK No. 94-V.
                    </>
                  ) : (
                    <>
                      Я даю согласие на сбор и обработку персональных данных в соответствии с{' '}
                      <Link
                        to={getLocalizedPath('/privacy')}
                        target="_blank"
                        className={`font-semibold underline underline-offset-2 ${
                          consentError ? 'text-red-800' : 'text-[#0082FB]'
                        }`}
                      >
                        Политикой конфиденциальности
                      </Link>{' '}
                      и Законом РК № 94-V «О персональных данных и их защите».
                    </>
                  )}
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
                      <Loader2 className="w-4 h-4 animate-spin" /> {lang === 'kz' ? 'Жіберілуде...' : lang === 'en' ? 'Sending...' : 'Отправка...'}
                    </>
                  ) : (
                    <>
                      {lang === 'kz' ? 'Өтінімді жіберу' : lang === 'en' ? 'Submit request' : 'Отправить заявку'} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    );
  };
