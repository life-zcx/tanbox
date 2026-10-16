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
    const user = (req as any).user;
    const maintenance = await setMaintenanceMode(active, message, user?.email || 'admin');

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

const DISPATCHES_FILE = path.resolve(__dirname, '../../storage/settings/telegram-dispatches.json');

function getDispatchesHistory(): any[] {
  try {
    if (fs.existsSync(DISPATCHES_FILE)) {
      const data = JSON.parse(fs.readFileSync(DISPATCHES_FILE, 'utf-8'));
      return Array.isArray(data) ? data : [];
    }
  } catch {}
  return [];
}

function saveDispatchRecord(record: any) {
  try {
    const list = getDispatchesHistory();
    list.unshift(record);
    const trimmed = list.slice(0, 30);
    const dir = path.dirname(DISPATCHES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DISPATCHES_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err: any) {
    logger.warn('Failed to save dispatch record:', err);
  }
}

/**
 * 8. Telegram Bot Overview & Dispatch History
 */
export const getTelegramOverview = async (req: AuthRequest, res: Response) => {
  try {
    const config = telegram.getChannelConfig();
    const history = getDispatchesHistory();
    return res.json({
      success: true,
      config,
      history,
    });
  } catch (err: any) {
    logger.error('Failed to get Telegram overview:', err);
    return res.status(500).json({ message: 'Ошибка получения данных Telegram' });
  }
};

/**
 * 9. Send Custom Message to Telegram Groups / Channels with formatting & buttons
 */
export const sendTelegramCustomMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { target, customChatId, text, buttonText, buttonUrl } = req.body;
    const config = telegram.getChannelConfig();

    let resolvedChatId = '';
    let chatName = '';

    if (target === 'leads') {
      resolvedChatId = config.leadsChatId;
      chatName = 'Чат 1 (Заявки & Заказы)';
    } else if (target === 'alerts') {
      resolvedChatId = config.alertsChatId;
      chatName = 'Чат 2 (DevOps & Алерты)';
    } else {
      resolvedChatId = String(customChatId || '').trim();
      chatName = `Чат ${resolvedChatId}`;
    }

    if (!resolvedChatId) {
      return res.status(400).json({ message: 'Не указан ID целевого чата' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Введите текст сообщения' });
    }

    const result = await telegram.sendDirectMessage({
      chatId: resolvedChatId,
      text: text.trim(),
      buttonText: buttonText ? String(buttonText).trim() : undefined,
      buttonUrl: buttonUrl ? String(buttonUrl).trim() : undefined,
    });

    saveDispatchRecord({
      id: 'msg_' + Date.now(),
      target,
      chatId: resolvedChatId,
      chatName,
      text: text.trim().slice(0, 300),
      buttonText: buttonText || undefined,
      buttonUrl: buttonUrl || undefined,
      sender: req.user?.email || 'Admin',
      date: new Date().toISOString(),
      success: result.success,
      error: result.success ? undefined : result.message,
    });

    if (result.success) {
      return res.json({
        success: true,
        message: `Сообщение успешно отправлено в ${chatName}!`,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (err: any) {
    logger.error('Failed to send custom telegram message:', err);
    return res.status(500).json({ message: err.message || 'Ошибка отправки в Telegram' });
  }
};

/**
 * 10. Send Daily Operations Summary Report into Telegram
 */
export const sendTelegramDailyReport = async (req: AuthRequest, res: Response) => {
  try {
    const { target = 'leads', customChatId } = req.body;
    const config = telegram.getChannelConfig();
    const resolvedChatId = target === 'leads' ? config.leadsChatId : target === 'alerts' ? config.alertsChatId : customChatId;

    if (!resolvedChatId) {
      return res.status(400).json({ message: 'Не указан ID чата' });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const [ordersToday, completedOrders] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: startOfDay } },
        select: { id: true, totalPrice: true, itemsCount: true, status: true, paymentStatus: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: startOfDay }, status: 'COMPLETED' } }),
    ]);

    const totalOrdersCount = ordersToday.length;
    const totalRevenue = ordersToday.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
    const totalItems = ordersToday.reduce((sum, o) => sum + Number(o.itemsCount || 0), 0);
    const paidOrders = ordersToday.filter((o) => o.paymentStatus === 'PAID').length;

    const almatyTime = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Almaty',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);

    const msg = [
      `📊 <b>ОПЕРАТИВНАЯ СВОДКА ЗА СЕГОДНЯ</b>`,
      `📅 <i>${almatyTime} (Алматы)</i>`,
      `──────────────────────────────`,
      `📦 <b>Новых заказов:</b> ${totalOrdersCount} шт.`,
      `💰 <b>Оборот за сегодня:</b> ${totalRevenue.toLocaleString('ru-RU')} ₸`,
      `🏷️ <b>Объем маркировки:</b> ${totalItems.toLocaleString('ru-RU')} шт.`,
      `💳 <b>Оплаченных заказов:</b> ${paidOrders} из ${totalOrdersCount}`,
      `✅ <b>Выполненных заказов:</b> ${completedOrders}`,
      `──────────────────────────────`,
      `👤 <i>Отправил администратор: ${req.user?.email || 'admin'}</i>`,
    ].join('\n');

    const result = await telegram.sendDirectMessage({
      chatId: resolvedChatId,
      text: msg,
      buttonText: '📊 Открыть панель управления',
      buttonUrl: 'https://admin.tanbox.kz',
    });

    saveDispatchRecord({
      id: 'report_' + Date.now(),
      target,
      chatId: resolvedChatId,
      chatName: target === 'leads' ? 'Чат 1 (Заявки)' : 'Чат 2 (DevOps)',
      text: `Сводка за день: ${totalOrdersCount} заказов, ${totalRevenue.toLocaleString('ru-RU')} ₸`,
      buttonText: 'Открыть панель',
      buttonUrl: 'https://admin.tanbox.kz',
      sender: req.user?.email || 'Admin',
      date: new Date().toISOString(),
      success: result.success,
    });

    if (result.success) {
      return res.json({ success: true, message: 'Суточная сводка успешно отправлена в Telegram!' });
    } else {
      return res.status(400).json({ success: false, message: result.message });
    }
  } catch (err: any) {
    logger.error('Failed to send daily report to Telegram:', err);
    return res.status(500).json({ message: err.message || 'Ошибка формирования отчета' });
  }
};

/**
 * 11. Send Server Health & Telemetry Report into Telegram
 */
export const sendTelegramServerReport = async (req: AuthRequest, res: Response) => {
  try {
    const { target = 'alerts', customChatId } = req.body;
    const config = telegram.getChannelConfig();
    const resolvedChatId = target === 'alerts' ? config.alertsChatId : target === 'leads' ? config.leadsChatId : customChatId;

    if (!resolvedChatId) {
      return res.status(400).json({ message: 'Не указан ID чата' });
    }

    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const freeMem = Math.round(os.freemem() / 1024 / 1024);
    const usedMem = totalMem - freeMem;
    const memPct = Math.round((usedMem / totalMem) * 100);
    const cpus = os.cpus()?.length || 1;
    const uptime = Math.round(process.uptime());
    const uptimeFormatted = `${Math.floor(uptime / 3600)} ч. ${Math.floor((uptime % 3600) / 60)} мин.`;
    const queueStats = typeof pdfQueue.getStats === 'function' ? pdfQueue.getStats() : { activeJobs: 0, waitingJobs: 0 };
    const queueActive = queueStats.activeJobs ?? 0;
    const queueWaiting = queueStats.waitingJobs ?? 0;

    const almatyTime = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Almaty',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    const msg = [
      `🖥️ <b>СТАТУС И ЗДОРОВЬЕ СЕРВЕРА TANBOX</b>`,
      `📅 <i>${almatyTime} (Алматы)</i>`,
      `──────────────────────────────`,
      `⏱️ <b>Аптайм процесса:</b> ${uptimeFormatted}`,
      `🧠 <b>Память (RAM):</b> ${usedMem} МБ / ${totalMem} МБ (${memPct}%)`,
      `⚡ <b>Ядра CPU:</b> ${cpus} cores`,
      `⚙️ <b>Очередь PDF:</b> ${queueActive} активных / ${queueWaiting} в ожидании`,
      `🟢 <b>База данных:</b> PostgreSQL подключена`,
      `──────────────────────────────`,
      `👤 <i>Запросил: ${req.user?.email || 'admin'}</i>`,
    ].join('\n');

    const result = await telegram.sendDirectMessage({
      chatId: resolvedChatId,
      text: msg,
      buttonText: '🔧 Контроль сервера',
      buttonUrl: 'https://admin.tanbox.kz/system',
    });

    saveDispatchRecord({
      id: 'server_' + Date.now(),
      target,
      chatId: resolvedChatId,
      chatName: target === 'alerts' ? 'Чат 2 (DevOps)' : 'Чат 1 (Заявки)',
      text: `Статус сервера: Uptime ${uptimeFormatted}, RAM ${memPct}%`,
      buttonText: 'Контроль сервера',
      buttonUrl: 'https://admin.tanbox.kz/system',
      sender: req.user?.email || 'Admin',
      date: new Date().toISOString(),
      success: result.success,
    });

    if (result.success) {
      return res.json({ success: true, message: 'Отчет о сервере успешно отправлен в Telegram!' });
    } else {
      return res.status(400).json({ success: false, message: result.message });
    }
  } catch (err: any) {
    logger.error('Failed to send server report to Telegram:', err);
    return res.status(500).json({ message: err.message || 'Ошибка отправки отчета о сервере' });
  }
};

/**
 * Legacy Test Telegram Alert
 */
export const testTelegramAlert = async (req: AuthRequest, res: Response) => {
  try {
    const { channel } = req.body;
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


