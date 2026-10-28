import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { trackModalOpenConversion, trackFormSubmitConversion } from '../../utils/analytics';
import { useLanguage } from '../../context/LanguageContext';

interface ServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceTitle?: string;
}

export const ServiceOrderModal: React.FC<ServiceOrderModalProps> = ({
  isOpen,
  onClose,
  initialServiceTitle,
}) => {
  const { lang, getLocalizedPath } = useLanguage();

  const serviceOptions = useMemo(() => {
    if (lang === 'kz') {
      return [
        'Тауарларды цифрлық таңбалау (кілтке дейін)',
        'Тауарларды кедендік қоймаларда таңбалау (ИМ-70)',
        'Тауарларды ҰТК каталогына енгізу (Ұлттық каталог)',
        'Data Matrix кодтарын эмиссиялау және жапсыру',
        'Қораптар мен паллеттерге агрегациялау (SSCC)',
        'Оклейка жасаушылардың көшпелі мобильді бригадалары (24/7)',
        '«Таңба» АЖ-ні 1C / ERP-мен интеграциялау және Консалтинг',
        'Кешенді аудит / Басқа сұрақ',
      ];
    }
    if (lang === 'en') {
      return [
        'Turnkey Product Serialization & Marking',
        'Customs Warehouse Serialization (IM-70)',
        'National Product Catalog (NKT) Registration',
        'Data Matrix Code Issuance and Labeling',
        'Carton and Pallet Aggregation (SSCC)',
        'On-Site Traveling Stickering Crews (24/7)',
        'IS Tanba Integration with 1C / ERP & Consulting',
        'Turnkey Audit / Inquiries',
      ];
    }
    return [
      'Цифровая маркировка товаров под ключ',
      'Маркировка на таможенных складах (ИМ-70)',
      'Заведение товаров в НКТ (Каталог товаров)',
      'Эмиссия и нанесение кодов Data Matrix',
      'Агрегация в короба и паллеты (SSCC)',
      'Выездные мобильные бригады оклейщиков (24/7)',
      'Интеграция ИС Танба с 1С / ERP и Консалтинг',
      'Другой вопрос / Комплексный аудит',
    ];
  }, [lang]);

  const [selectedService, setSelectedService] = useState(initialServiceTitle || serviceOptions[0]);
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field validation error states
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Phone Auto-Formatter (+7 7XX XXX-XX-XX)
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
      setPhoneError(lang === 'kz' ? 'Байланыс телефон нөмірін көрсетіңіз' : lang === 'en' ? 'Enter a contact telephone number' : 'Укажите контактный номер телефона');
      return false;
    }
    if (digitsOnly.length !== 11) {
      setPhoneError(lang === 'kz' ? 'Нөмір 11 цифрдан тұруы керек (+7 7XX XXX-XX-XX)' : lang === 'en' ? 'Number must contain 11 digits (+7 7XX XXX-XX-XX)' : 'Номер должен содержать 11 цифр (+7 7XX XXX-XX-XX)');
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
      setEmailError(lang === 'kz' ? 'Қате e-mail (мысалы: info@company.kz)' : lang === 'en' ? 'Invalid e-mail (example: info@company.kz)' : 'Некорректный e-mail (пример: info@company.kz)');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isPhoneValid = validatePhone(phone);
    const isEmailValid = validateEmail(email);

    if (!isPhoneValid || !isEmailValid) {
      setError(lang === 'kz' ? 'Өрістердің дұрыс толтырылғанын тексеріңіз.' : lang === 'en' ? 'Please check the required fields.' : 'Пожалуйста, проверьте правильность заполнения полей.');
      return;
    }

    if (!consent) {
      setError(lang === 'kz' ? 'Дербес деректерді жинау мен өңдеуге келісім беру қажет (ҚР № 94-V Заңы).' : lang === 'en' ? 'Personal data processing consent is required (Law of RK No. 94-V).' : 'Необходимо подтвердить согласие на сбор и обработку персональных данных (Закон РК № 94-V).');
      return;
    }

    setLoading(true);

    // Post to backend REST API
    try {
      await apiClient.post('/leads', {
        serviceTitle: selectedService,
        companyName,
        phone,
        email: email || undefined,
        notes: notes || undefined,
      });
    } catch (err) {
      console.warn('Backend API submission warning:', err);
    } finally {
      trackFormSubmitConversion();
      setSubmitted(true);
      setLoading(false);
    }
  };

  const hasTrackedOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!hasTrackedOpenRef.current) {
        hasTrackedOpenRef.current = true;
        trackModalOpenConversion();
      }
    } else {
      hasTrackedOpenRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialServiceTitle) {
      setSelectedService(initialServiceTitle);
    } else {
      setSelectedService(serviceOptions[0]);
    }
  }, [initialServiceTitle, isOpen, serviceOptions]);

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

  const handleResetAndClose = () => {
    setSubmitted(false);
    setCompanyName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setConsent(false);
    setError(null);
    setPhoneError(null);
    setEmailError(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleResetAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const overlayMouseDownRef = useRef(false);

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    overlayMouseDownRef.current = e.target === e.currentTarget;
  };

  const handleOverlayMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (overlayMouseDownRef.current && e.target === e.currentTarget) {
      handleResetAndClose();
    }
    overlayMouseDownRef.current = false;
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative space-y-6 max-h-[90vh] overflow-y-auto"
      >
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-gray-100 text-gray-400 hover:text-[#111827] hover:bg-gray-200 flex items-center justify-center transition-all cursor-pointer"
          aria-label={lang === 'kz' ? 'Жабу' : lang === 'en' ? 'Close' : 'Закрыть'}
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
                {lang === 'kz' ? 'Өтінім сәтті қабылданды!' : lang === 'en' ? 'Request successfully submitted!' : 'Заявка успешно принята!'}
              </h3>
              <p className="text-sm text-[#64748B] max-w-md mx-auto font-normal leading-relaxed">
                {lang === 'kz' ? (
                  <>
                    Біздің <span className="font-bold text-[#111827]">«{selectedService}»</span> қызметі бойынша маманымыз сізбен <span className="font-mono font-bold text-[#0082FB]">{phone}</span> нөмірі арқылы 15 минут ішінде хабарласады.
                  </>
                ) : lang === 'en' ? (
                  <>
                    Our specialist for <span className="font-bold text-[#111827]">"{selectedService}"</span> will contact you at <span className="font-mono font-bold text-[#0082FB]">{phone}</span> within 15 minutes.
                  </>
                ) : (
                  <>
                    Наш профильный специалист по услуге <span className="font-bold text-[#111827]">«{selectedService}»</span> свяжется с вами по номеру <span className="font-mono font-bold text-[#0082FB]">{phone}</span> в течение 15 минут.
                  </>
                )}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-md shadow-[#0082FB]/25 active:scale-95 cursor-pointer"
              >
                {lang === 'kz' ? 'Терезені жабу' : lang === 'en' ? 'Close window' : 'Отлично, закрыть окно'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1 pr-6">
              <h3 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                {lang === 'kz' ? 'Қызметке тапсырыс беру' : lang === 'en' ? 'Order Turnkey Service' : 'Заказать услугу'}
              </h3>
              <p className="text-xs text-[#64748B]">
                {lang === 'kz' 
                  ? 'Алғашқы кеңес алу және құнын есептеу үшін байланыс деректерін толтырыңыз' 
                  : lang === 'en' 
                  ? 'Fill in contact details for consultation and cost estimation' 
                  : 'Заполните контактные данные для первичной консультации и расчета стоимости'}
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
                  {lang === 'kz' ? 'Қызмет' : lang === 'en' ? 'Service' : 'Услуга'}
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0082FB] cursor-pointer"
                >
                  {serviceOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company / Name */}
              <div>
                <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1">
                  {lang === 'kz' ? 'Компания атауы / Аты-жөні' : lang === 'en' ? 'Company Name / Full Name' : 'Наименование компании / ФИО'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={lang === 'kz' ? 'Мысалы: "Қазақстан Трейд" ЖШС немесе Арман Серіков' : lang === 'en' ? 'E.g.: Kazakhstan Trade LLP or John Doe' : 'Например: ТОО "Казахстан Трейд" или Иван Иванов'}
                  className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1 flex items-center justify-between">
                  <span>{lang === 'kz' ? 'Байланыс телефоны' : lang === 'en' ? 'Phone Number' : 'Контактный телефон'} <span className="text-red-500">*</span></span>
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

              {/* Email (Optional) */}
              <div>
                <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1 flex items-center justify-between">
                  <span>E-mail ({lang === 'kz' ? 'міндетті емес' : lang === 'en' ? 'optional' : 'необязательно'})</span>
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

              {/* Notes */}
              <div>
                <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1">
                  {lang === 'kz' ? 'Пікір / Қосымша мәліметтер' : lang === 'en' ? 'Comments / Requirements' : 'Комментарий / Пожелания'}
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'kz' ? 'Партия көлемі, мерзімі, қойма мекенжайы...' : lang === 'en' ? 'Batch volume, turnaround, warehouse address...' : 'Объем партии, сроки, адрес склада...'}
                  className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl p-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              {/* Personal Data Consent Checkbox (Закон РК № 94-V) */}
              <div className="flex items-start gap-2 pt-1 text-left">
                <input
                  type="checkbox"
                  id="modal-consent"
                  required
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (e.target.checked && error?.includes('согласие')) {
                      setError(null);
                    }
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0082FB] focus:ring-[#0082FB] cursor-pointer shrink-0"
                />
                <label htmlFor="modal-consent" className="text-[11px] text-[#64748B] leading-relaxed cursor-pointer select-none">
                  {lang === 'kz' ? (
                    <>
                      Мен дербес деректерді жинауға және өңдеуге келісім беремін ({' '}
                      <Link to={getLocalizedPath('/privacy')} target="_blank" className="text-[#0082FB] hover:underline font-semibold">
                        Құпиялылық саясаты
                      </Link>{' '}
                      және ҚР № 94-V Заңына сәйкес).
                    </>
                  ) : lang === 'en' ? (
                    <>
                      I consent to the collection and processing of personal data in accordance with the{' '}
                      <Link to={getLocalizedPath('/privacy')} target="_blank" className="text-[#0082FB] hover:underline font-semibold">
                        Privacy Policy
                      </Link>{' '}
                      and Law of RK No. 94-V.
                    </>
                  ) : (
                    <>
                      Я даю согласие на сбор и обработку персональных данных в соответствии с{' '}
                      <Link to={getLocalizedPath('/privacy')} target="_blank" className="text-[#0082FB] hover:underline font-semibold">
                        Политикой конфиденциальности
                      </Link>{' '}
                      и Законом РК № 94-V.
                    </>
                  )}
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-3.5 rounded-xl transition-all active:scale-95 shadow-md shadow-[#0082FB]/25 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> {lang === 'kz' ? 'Өңделуде...' : lang === 'en' ? 'Processing...' : 'Обработка...'}
                  </>
                ) : (
                  <>
                    {lang === 'kz' ? 'Өтінімді жіберу' : lang === 'en' ? 'Submit request' : 'Отправить заявку'} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          </>
        )}

      </div>
    </div>,
    document.body
  );
};
