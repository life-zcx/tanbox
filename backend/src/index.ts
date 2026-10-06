import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import calculatorRoutes from './routes/calculator.routes';
import ordersRoutes from './routes/orders.routes';
import usersRoutes from './routes/users.routes';
import metricsRoutes from './routes/metrics.routes';
import logsRoutes from './routes/logs.routes';
import leadsRoutes from './routes/leads.routes';
import tariffsRoutes from './routes/tariffs.routes';
import labelTemplatesRoutes from './routes/labelTemplates.routes';
import userTemplatesRoutes from './routes/userTemplates.routes';
import labelsRoutes from './routes/labels.routes';
import { logger } from './utils/logger';
import { generalApiLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Enable proxy trusting (running behind Caddy / reverse proxy)
app.set('trust proxy', 1);

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Strict CORS whitelist: supports production tanbox.kz domains, localhost, LAN IPs, and .local
const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return true;
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host)) return true;
    if (host === 'tanbox.kz' || host.endsWith('.tanbox.kz')) return true;
    if (process.env.ALLOWED_ORIGINS) {
      const allowed = process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
      if (allowed.includes(origin) || allowed.includes(host)) return true;
    }
  } catch {
    return false;
  }
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS access blocked by policy'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Note: /uploads static directory is intentionally not served publicly to prevent unauthenticated data leaks.
// All order files are accessible only via authenticated endpoints with ownership checks.

// Apply general API rate limiting
app.use('/api/', generalApiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
    });
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'tanbox-backend-api', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/tariffs', tariffsRoutes);
app.use('/api/label-templates', labelTemplatesRoutes);
app.use('/api/user-templates', userTemplatesRoutes);
app.use('/api/labels', labelsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.message === 'CORS access blocked by policy') {
    return res.status(403).json({ message: 'Доступ запрещён политикой CORS' });
  }
  logger.error(`Unhandled Error on ${req.method} ${req.url}:`, err);
  return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  logger.info(`🚀 TANBOX Backend REST API running on port ${PORT}`);
});
