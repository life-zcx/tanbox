import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || '5050',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  get JWT_SECRET(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not defined in process.env!');
      }
      console.warn('⚠️ WARNING: JWT_SECRET is not set in process.env! Please specify JWT_SECRET in .env file.');
      return 'dev_only_local_secret_please_change_in_env_file';
    }
    return secret;
  },
  get ENCRYPTION_SECRET(): string {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL SECURITY ERROR: ENCRYPTION_SECRET environment variable is not defined in process.env!');
      }
      console.warn('⚠️ WARNING: ENCRYPTION_SECRET is not set in process.env! Using local dev fallback.');
      return 'tanbox_markirovka_encryption_secret_key_2026_32bytes!!';
    }
    return secret;
  },
  get FREEDOM_PAY_MERCHANT_ID(): string {
    return process.env.FREEDOM_PAY_MERCHANT_ID || '';
  },
  get FREEDOM_PAY_SECRET_KEY(): string {
    return process.env.FREEDOM_PAY_SECRET_KEY || '';
  },
  get FREEDOM_PAY_API_URL(): string {
    return process.env.FREEDOM_PAY_API_URL || 'https://api.freedompay.kz';
  },
  get FREEDOM_PAY_TEST_MODE(): string {
    return process.env.FREEDOM_PAY_TEST_MODE || '1';
  },
  get APP_URL(): string {
    return process.env.APP_URL || 'https://tanbox.kz';
  },
  get LK_URL(): string {
    return process.env.LK_URL || 'https://lk.tanbox.kz';
  },
  get API_URL(): string {
    return process.env.API_URL || 'https://api.tanbox.kz';
  },
};

