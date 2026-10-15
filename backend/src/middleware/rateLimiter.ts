import rateLimit from 'express-rate-limit';

/**
 * Extracts true client IP address prioritizing Cloudflare (CF-Connecting-IP)
 * and reverse proxy headers (X-Real-IP, X-Forwarded-For) before falling back to req.ip.
 */
export const getClientIp = (req: any): string => {
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp.trim()) return cfIp.trim();
  const xRealIp = req.headers['x-real-ip'];
  if (typeof xRealIp === 'string' && xRealIp.trim()) return xRealIp.trim();
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string' && xForwardedFor.trim()) {
    return xForwardedFor.split(',')[0].trim();
  }
  return req.ip || '127.0.0.1';
};

// Strict rate limit for authentication (login / register) to prevent brute-force attacks
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each real IP to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: {
    message: 'Слишком много попыток входа/регистрации с вашего IP. Попробуйте через 15 минут.',
  },
});

// Rate limit for public lead submissions to prevent spam and DB bloat
export const leadRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // limit each IP to 15 lead submissions per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: {
    message: 'Слишком много заявок с вашего IP. Пожалуйста, подождите перед отправкой новой заявки.',
  },
});

// Rate limit for frontend telemetry logs to prevent log flooding / disk DoS
export const logsRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // max 60 log events per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: {
    message: 'Превышен лимит отправки логов',
  },
});

// General public API limiter
export const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // max 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
});

