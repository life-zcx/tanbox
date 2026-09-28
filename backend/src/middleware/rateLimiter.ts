import rateLimit from 'express-rate-limit';

// Strict rate limit for authentication (login / register) to prevent brute-force attacks
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Слишком много попыток входа/регистрации с вашего IP. Попробуйте через 15 минут.',
  },
});

// Rate limit for public lead submissions to prevent spam and DB bloat
export const leadRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 8, // limit each IP to 8 lead submissions per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Слишком много заявок с вашего IP. Пожалуйста, подождите перед отправкой новой заявки.',
  },
});

// Rate limit for frontend telemetry logs to prevent log flooding / disk DoS
export const logsRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // max 30 log events per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Превышен лимит отправки логов',
  },
});

// General public API limiter
export const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // max 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});
