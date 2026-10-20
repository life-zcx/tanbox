/**
 * Google Ads & Analytics tracking utilities
 * Account ID: AW-18368406368
 */

export const GOOGLE_ADS_ID = 'AW-18368406368';

// Google Ads conversion event IDs:
// 1. Открытие модалки (modal open)
export const CONVERSION_MODAL_OPEN = 'AW-18368406368/ApjmCJPU_qIdEODG3rZE';
// 2. Отправка формы (form submit)
export const CONVERSION_FORM_SUBMIT = 'AW-18368406368/ZnCBCJDU_qIdEODG3rZE';
// 3. Клик по WhatsApp (WhatsApp click)
export const CONVERSION_WHATSAPP_CLICK = 'AW-18368406368/IF-ZCJPMhaMdEODG3rZE';

// Backward compatibility alias for existing code
export const CONVERSION_SEND_TO = CONVERSION_FORM_SUBMIT;

export interface ConversionOptions {
  value?: number;
  currency?: string;
  transactionId?: string;
  url?: string;
}

const isDevEnvironment = (): boolean => {
  if (typeof window === 'undefined') return true;
  const hostname = window.location.hostname;
  return (
    ['localhost', '127.0.0.1', '::1'].includes(hostname) ||
    hostname.includes('dev') ||
    hostname.includes('test') ||
    hostname.endsWith('.local')
  );
};

export const sendGoogleAdsConversion = (
  sendTo: string,
  options: ConversionOptions = {}
): boolean => {
  const { value = 1.0, currency = 'USD', transactionId, url } = options;

  const callback = () => {
    if (typeof url !== 'undefined' && url && typeof window !== 'undefined') {
      window.location.href = url;
    }
  };

  if (typeof window !== 'undefined') {
    if (isDevEnvironment()) {
      console.debug('[Analytics:dev-blocked] Google Ads conversion suppressed in dev:', {
        send_to: sendTo,
        value,
        currency,
        transactionId,
        url,
      });
      if (url) callback();
      return false;
    }

    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      const payload: Record<string, any> = {
        send_to: sendTo,
        value,
        currency,
        event_callback: callback,
      };
      if (transactionId) {
        payload.transaction_id = transactionId;
      }
      gtag('event', 'conversion', payload);
    } else {
      if (url) callback();
    }
  }

  return false;
};

/**
 * Event snippet for: Открытие модалки conversion page
 * send_to: AW-18368406368/ApjmCJPU_qIdEODG3rZE
 */
export const trackModalOpenConversion = (url?: string): boolean => {
  return sendGoogleAdsConversion(CONVERSION_MODAL_OPEN, {
    value: 1.0,
    currency: 'USD',
    url,
  });
};

/**
 * Event snippet for: Отправка формы conversion page
 * send_to: AW-18368406368/ZnCBCJDU_qIdEODG3rZE
 */
export const trackFormSubmitConversion = (
  url?: string,
  options?: ConversionOptions
): boolean => {
  return sendGoogleAdsConversion(CONVERSION_FORM_SUBMIT, {
    value: 1.0,
    currency: 'USD',
    ...options,
    url,
  });
};

/**
 * General helper (backward compatible)
 */
export const trackGoogleConversion = (options: ConversionOptions = {}): boolean => {
  return sendGoogleAdsConversion(CONVERSION_FORM_SUBMIT, options);
};

/**
 * Event snippet for: Клик по WhatsApp conversion page
 * send_to: AW-18368406368/IF-ZCJPMhaMdEODG3rZE
 */
export const trackWhatsAppClick = (url?: string): boolean => {
  return sendGoogleAdsConversion(CONVERSION_WHATSAPP_CLICK, {
    value: 1.0,
    currency: 'USD',
    url,
  });
};

/**
 * Build localized WhatsApp consultation link with pre-filled greeting text
 */
export const getWhatsAppConsultationUrl = (lang: string = 'ru', phone: string = '77003048532'): string => {
  const text =
    lang === 'kz'
      ? 'Сәлеметсіз бе! TANBOX-та тауарларды таңбалау қызметі бойынша кеңес алғым келеді.'
      : lang === 'en'
      ? 'Hello! I would like to get a consultation on product serialization services at TANBOX.'
      : 'Здравствуйте! Хочу получить консультацию по маркировке товаров в TANBOX.';
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

// Bind to window for external or inline script access
if (typeof window !== 'undefined') {
  (window as any).gtag_report_modal_open = trackModalOpenConversion;
  (window as any).gtag_report_form_submit = trackFormSubmitConversion;
  (window as any).gtag_report_conversion = trackFormSubmitConversion;
  (window as any).gtag_report_whatsapp = trackWhatsAppClick;
  (window as any).trackWhatsAppClick = trackWhatsAppClick;
}
