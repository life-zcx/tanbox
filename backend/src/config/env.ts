import { randomBytes, createHash } from 'crypto';
const compromisedHashes = new Set(["888a36b70f522aae8c25ac1ebff95bbe14b87a89dacca821c88eb13e0ad701ec", "df90fbd09036f9281de995a4afaa9f92f797409fc04b1274089bed341f409d0c", "dbbba49bd773a16de890fa6eeba075441af315701567d1fefdcf7f0504bf5a2c"]);
const compromised = (value: string) => compromisedHashes.has(createHash('sha256').update(value).digest('hex'));
const developmentJwtSecret = randomBytes(64).toString('hex');
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
      return developmentJwtSecret;
    }
    if (process.env.NODE_ENV === 'production') {
      if (secret === 'replace_with_strong_random_jwt_secret_openssl_rand_hex_64' || compromised(secret) || secret.length < 32) {
        throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET is too short or set to template placeholder in production!');
      }
    }
    return secret;
  },
  get ENCRYPTION_SECRET(): string {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL SECURITY ERROR: ENCRYPTION_SECRET environment variable is not defined in process.env!');
      }
      throw new Error('Set ENCRYPTION_SECRET; an ephemeral encryption key would lose stored credentials');
    }
    if (process.env.NODE_ENV === 'production') {
      if (secret === 'replace_with_strong_random_encryption_secret_minimum_32_chars' || compromised(secret) || secret.length < 32) {
        throw new Error('CRITICAL SECURITY ERROR: ENCRYPTION_SECRET is too short or set to template placeholder in production!');
      }
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


if (process.env.NODE_ENV === 'production') {
  void env.JWT_SECRET;
  void env.ENCRYPTION_SECRET;
  const databasePassword = process.env.POSTGRES_PASSWORD || (process.env.DATABASE_URL ? decodeURIComponent(new URL(process.env.DATABASE_URL).password) : '');
  if (databasePassword && compromised(databasePassword)) throw new Error('Database credential exposed in repository history; rotate before production startup');
}
