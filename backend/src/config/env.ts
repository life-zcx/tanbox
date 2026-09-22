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
        throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not defined!');
      }
      // Fallback only for strict local emergency, logged with warning
      console.warn('⚠️ WARNING: JWT_SECRET is not set in process.env! Please specify JWT_SECRET in .env file.');
      return 'dev_only_local_secret_please_change_in_env_file';
    }
    return secret;
  },
};
