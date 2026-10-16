/**
 * Google Ads & Analytics tracking utilities
 * Account ID: AW-18368406368
 */

export const GOOGLE_ADS_ID = 'AW-18368406368';
export const CONVERSION_SEND_TO = 'AW-18368406368/-28GCPq0up0dEODG3rZE';

export interface ConversionOptions {
  value?: number;
  currency?: string;
  transactionId?: string;
}

export const trackGoogleConversion = (options: ConversionOptions = {}) => {
  const { value = 1.0, currency = 'USD', transactionId } = options;

  if (typeof window !== 'undefined') {
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      const payload: Record<string, any> = {
        send_to: CONVERSION_SEND_TO,
        value,
        currency,
      };
      if (transactionId) {
        payload.transaction_id = transactionId;
      }
      gtag('event', 'conversion', payload);
    }
  }
};
