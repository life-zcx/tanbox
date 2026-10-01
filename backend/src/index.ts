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

// CORS configuration - dynamic origin reflection to support localhost, 127.0.0.1, LAN IPs, and domain names
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

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
