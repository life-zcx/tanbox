import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import calculatorRoutes from './routes/calculator.routes';
import ordersRoutes from './routes/orders.routes';
import usersRoutes from './routes/users.routes';
import metricsRoutes from './routes/metrics.routes';
import logsRoutes from './routes/logs.routes';
import leadsRoutes from './routes/leads.routes';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

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

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Unhandled Error on ${req.method} ${req.url}:`, err);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  logger.info(`🚀 TANBOX Backend REST API running on port ${PORT}`);
});

