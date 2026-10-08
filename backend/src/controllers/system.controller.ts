import { Response } from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { pdfQueue } from '../services/pdfQueue.service';
import { logger } from '../utils/logger';
import { telegram } from '../services/telegram.service';
import { createDatabaseBackup as runCreateBackup, getBackupsList as runGetBackupsList, backupsDir } from '../services/backup.service';
import { isMaintenanceActive, getMaintenanceMessage, setMaintenanceMode } from '../services/maintenance.service';

export { isMaintenanceActive, getMaintenanceMessage };

const execPromise = util.promisify(exec);
const uploadsDir = path.resolve(process.cwd(), 'uploads/orders');

/**
 * 1. Comprehensive System & Infrastructure Telemetry
 */
export const getSystemHealth = async (req: AuthRequest, res: Response) => {
  try {
    const startTime = Date.now();

    // 1. Database Ping & Diagnostics
    let dbStatus = 'ok';
    let dbLatencyMs = 0;
    let dbSizeFormatted = 'Н/Д';
    let dbConnectionsCount = 0;

    try {
      const dbPingStart = Date.now();
      await prisma.$queryRaw`SELECT 1 as ping`;
      dbLatencyMs = Date.now() - dbPingStart;

      // Fetch DB Size and Connections
      const [sizeResult, connResult]: [any, any] = await Promise.all([
        prisma.$queryRawUnsafe(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`),
        prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM pg_stat_activity WHERE datname = current_database()`),
      ]);

      if (Array.isArray(sizeResult) && sizeResult[0]?.size) {
        dbSizeFormatted = sizeResult[0].size;
      }
      if (Array.isArray(connResult) && connResult[0]?.count) {
        dbConnectionsCount = connResult[0].count;
      }
    } catch (dbErr: any) {
      dbStatus = 'error';
      logger.error('DB Healthcheck failed:', dbErr);
    }

    // 2. Memory Diagnostics
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsagePercent = Math.round((usedMem / totalMem) * 100);

    // 3. CPU Diagnostics
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'Generic CPU';
    const cpuCores = cpus.length;
    const loadAvg = os.loadavg(); // [1m, 5m, 15m]

    // 4. PDF Queue Stats
    const queueStats = pdfQueue.getStats();

    // 5. Total response
    return res.json({
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      serverUptimeSec: Math.floor(os.uptime()),
      processUptimeSec: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        size: dbSizeFormatted,
        activeConnections: dbConnectionsCount,
      },
      system: {
        platform: `${os.type()} ${os.release()} (${os.arch()})`,
        nodeVersion: process.version,
        cpuModel,
        cpuCores,
        loadAverage: loadAvg,
        ramTotalMb: Math.round(totalMem / (1024 * 1024)),
        ramUsedMb: Math.round(usedMem / (1024 * 1024)),
        ramFreeMb: Math.round(freeMem / (1024 * 1024)),
        ramUsagePercent,
        processMemoryRssMb: Math.round(memUsage.rss / (1024 * 1024)),
        processHeapUsedMb: Math.round(memUsage.heapUsed / (1024 * 1024)),
      },
      pdfQueue: queueStats,
      maintenance: {
        active: isMaintenanceActive(),
        message: getMaintenanceMessage(),
      },
      responseTimeMs: Date.now() - startTime,
    });
  } catch (error: any) {
    logger.error('System healthcheck error:', error);
    return res.status(500).json({ message: 'Ошибка получения метрик системы' });
  }
};

/**
 * 2. Get Database Backups List
 */
export const getBackupsList = async (req: AuthRequest, res: Response) => {
  try {
    const backups = await runGetBackupsList();
    return res.json({ backups });
  } catch (error: any) {
    logger.error('Get backups list error:', error);
    return res.status(500).json({ message: 'Ошибка получения списка резервных копий' });
  }
};

/**
 * 3. Create Manual Database Backup (1-Click)
 */
export const createDatabaseBackup = async (req: AuthRequest, res: Response) => {
  try {
    const backup = await runCreateBackup();
    return res.status(201).json({
      message: 'Резервная копия успешно создана',
      backup,
    });
  } catch (error: any) {
    logger.error('Create backup error:', error);
    return res.status(500).json({ message: 'Ошибка создания резервной копии: ' + (error.message || error) });
  }
};

/**
 * 4. Download Database Backup File
 */
export const downloadBackupFile = async (req: AuthRequest, res: Response) => {
  try {
    const rawFileName = req.params.fileName;
    // Prevent path traversal
    const safeFileName = path.basename(rawFileName);
    const filePath = path.join(backupsDir, safeFileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Файл бэкапа не найден' });
    }

    return res.download(filePath, safeFileName);
  } catch (error: any) {
    logger.error('Download backup error:', error);
    return res.status(500).json({ message: 'Ошибка скачивания резервной копии' });
  }
};

/**
 * 5. Storage Analysis (Uploads, PDFs, Logs)
 */
export const getStorageAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    let totalCsvCount = 0;
    let totalCsvBytes = 0;
    let totalPdfCount = 0;
    let totalPdfBytes = 0;

    if (fs.existsSync(uploadsDir)) {
      const orderDirs = await fs.promises.readdir(uploadsDir);
      for (const od of orderDirs) {
        const fullDirPath = path.join(uploadsDir, od);
        try {
          const stats = await fs.promises.stat(fullDirPath);
          if (stats.isDirectory()) {
            const files = await fs.promises.readdir(fullDirPath);
            for (const file of files) {
              const fPath = path.join(fullDirPath, file);
              const fStat = await fs.promises.stat(fPath);
              if (file.toLowerCase().endsWith('.pdf')) {
                totalPdfCount++;
                totalPdfBytes += fStat.size;
              } else if (file.toLowerCase().endsWith('.csv') || file.toLowerCase().endsWith('.txt')) {
                totalCsvCount++;
                totalCsvBytes += fStat.size;
              }
            }
          }
        } catch {}
      }
    }

    const logsDir = path.resolve(process.cwd(), 'logs');
    let logsBytes = 0;
    if (fs.existsSync(logsDir)) {
      const lFiles = await fs.promises.readdir(logsDir);
      for (const lf of lFiles) {
        try {
          const lStat = await fs.promises.stat(path.join(logsDir, lf));
          logsBytes += lStat.size;
        } catch {}
      }
    }

    return res.json({
      uploads: {
        totalCsvCount,
        totalCsvSizeFormatted: `${(totalCsvBytes / (1024 * 1024)).toFixed(2)} MB`,
        totalPdfCount,
        totalPdfSizeFormatted: `${(totalPdfBytes / (1024 * 1024)).toFixed(2)} MB`,
        totalStorageBytes: totalCsvBytes + totalPdfBytes,
        totalStorageFormatted: `${((totalCsvBytes + totalPdfBytes) / (1024 * 1024)).toFixed(2)} MB`,
      },
      logs: {
        totalSizeBytes: logsBytes,
        totalSizeFormatted: `${(logsBytes / (1024 * 1024)).toFixed(2)} MB`,
      },
    });
  } catch (error: any) {
    logger.error('Storage analysis error:', error);
    return res.status(500).json({ message: 'Ошибка анализа дискового пространства' });
  }
};

/**
 * 6. Clean Old Cached PDF Files (Frees up gigabytes)
 */
export const cleanPdfCache = async (req: AuthRequest, res: Response) => {
  try {
    let deletedCount = 0;
    let freedBytes = 0;

    if (fs.existsSync(uploadsDir)) {
      const orderDirs = await fs.promises.readdir(uploadsDir);
      for (const od of orderDirs) {
        const fullDirPath = path.join(uploadsDir, od);
        try {
          const stats = await fs.promises.stat(fullDirPath);
          if (stats.isDirectory()) {
            const files = await fs.promises.readdir(fullDirPath);
            for (const file of files) {
              if (file.toLowerCase().endsWith('.pdf')) {
                const fPath = path.join(fullDirPath, file);
                const fStat = await fs.promises.stat(fPath);
                await fs.promises.unlink(fPath);
                deletedCount++;
                freedBytes += fStat.size;
              }
            }
          }
        } catch {}
      }
    }

    const freedFormatted = `${(freedBytes / (1024 * 1024)).toFixed(2)} MB`;
    logger.info(`Cleaned PDF cache: ${deletedCount} files deleted, ${freedFormatted} freed.`);

    return res.json({
      message: `Кэш PDF успешно очищен. Удалено ${deletedCount} файлов, освобождено ${freedFormatted}`,
      deletedCount,
      freedBytes,
      freedFormatted,
    });
  } catch (error: any) {
    logger.error('Clean PDF cache error:', error);
    return res.status(500).json({ message: 'Ошибка очистки кэша PDF' });
  }
};

/**
 * 7. Maintenance Mode Control
 */
export const toggleMaintenanceMode = async (req: AuthRequest, res: Response) => {
  try {
    const { active, message } = req.body;
    const maintenance = setMaintenanceMode(active, message);

    logger.info(`Maintenance mode toggled: active=${maintenance.active}`);

    return res.json({
      message: maintenance.active
        ? 'Режим техобслуживания включен'
        : 'Режим техобслуживания отключен',
      maintenance,
    });
  } catch (error: any) {
    logger.error('Toggle maintenance mode error:', error);
    return res.status(500).json({ message: 'Ошибка изменения режима техобслуживания' });
  }
};

/**
 * 8. Send Test Telegram Alert directly from Admin Panel
 */
export const testTelegramAlert = async (req: AuthRequest, res: Response) => {
  try {
    const { channel } = req.body; // 'leads' | 'alerts'
    if (channel === 'leads') {
      await telegram.sendNewLeadNotification({
        id: 'TEST-LEAD-' + Math.floor(Math.random() * 9000 + 1000),
        serviceTitle: 'Тестовая заявка (проверка из админки)',
        companyName: 'ТОО "Проверка Связи"',
        phone: '+7 777 000 11 22',
        email: 'test@tanbox.kz',
        notes: 'Тестовое оповещение отправлено администратором из панели Контроль сервера',
      });
      return res.json({ message: 'Тестовое уведомление успешно отправлено в Чат 1 (Заявки)' });
    } else if (channel === 'alerts') {
      await telegram.sendDevOpsAlert('ТЕСТОВЫЙ АЛЕРТ DEVOPS & ОШИБКИ', {
        'Отправитель': req.user?.email || 'Администратор',
        'Окружение': process.env.NODE_ENV || 'production',
        'Статус': 'Тест связи с Telegram Bot API успешен',
      });
      return res.json({ message: 'Тестовое уведомление успешно отправлено в Чат 2 (DevOps)' });
    } else {
      return res.status(400).json({ message: 'Неверный канал. Укажите channel: "leads" или "alerts"' });
    }
  } catch (err: any) {
    logger.error('Test telegram alert failed:', err);
    return res.status(500).json({ message: 'Ошибка отправки тестового уведомления в Telegram' });
  }
};

