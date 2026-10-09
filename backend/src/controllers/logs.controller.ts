import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { telegram } from '../services/telegram.service';

const logsDir = path.join(__dirname, '../../logs');

export const handleFrontendLogs = (req: Request, res: Response) => {
  try {
    const { level = 'info', message, meta, userAgent, url } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Поле message обязательно и должно быть строкой' });
    }

    // Sanitize and limit log lengths to prevent disk bloat and CRLF injection
    const cleanLevel = ['info', 'warn', 'error'].includes(String(level).toLowerCase())
      ? String(level).toLowerCase()
      : 'info';

    // Strip carriage returns and newlines to prevent log injection
    const cleanMessage = String(message)
      .slice(0, 500)
      .replace(/[\r\n]+/g, ' ');

    const cleanUrl = url ? String(url).slice(0, 200).replace(/[\r\n]+/g, '') : undefined;
    const cleanUserAgent = userAgent ? String(userAgent).slice(0, 200).replace(/[\r\n]+/g, '') : undefined;

    logger.frontend(cleanLevel, cleanMessage, {
      ...(meta && typeof meta === 'object' ? meta : {}),
      url: cleanUrl,
      clientIp: req.ip || req.headers['x-forwarded-for'],
      userAgent: cleanUserAgent || req.headers['user-agent'],
    });

    if (cleanLevel === 'error') {
      telegram.sendFrontendTelemetryAlert({
        message: cleanMessage,
        url: cleanUrl,
        userAgent: cleanUserAgent,
        clientIp: (req.ip || req.headers['x-forwarded-for']) as string,
      }).catch(() => {});
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err: any) {
    logger.error('Failed to log frontend message', err);
    return res.status(500).json({ message: 'Ошибка сохранения логов' });
  }
};

/**
 * Admin endpoint to inspect server logs (access, error, frontend) in real time
 */
export const getSystemLogs = async (req: AuthRequest, res: Response) => {
  try {
    const type = String(req.query.type || 'error').toLowerCase(); // 'error' | 'access' | 'frontend'
    const limit = Math.min(500, Math.max(10, parseInt(String(req.query.limit || 100), 10)));
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

    let logFileName = 'error.log';
    if (type === 'access') logFileName = 'access.log';
    else if (type === 'frontend') logFileName = 'frontend.log';

    const targetPath = path.join(logsDir, logFileName);

    if (!fs.existsSync(targetPath)) {
      return res.json({
        type,
        totalLines: 0,
        logs: [],
        fileSizeFormatted: '0 KB',
      });
    }

    const stat = await fs.promises.stat(targetPath);
    const fileSizeFormatted = `${(stat.size / 1024).toFixed(1)} KB`;

    // Read file in chunks from the end if large, or read whole file
    const content = await fs.promises.readFile(targetPath, 'utf-8');
    let lines = content.split('\n').filter((l) => l.trim().length > 0);

    if (search) {
      lines = lines.filter((l) => l.toLowerCase().includes(search));
    }

    // Return the latest N lines in reverse chronological order
    const latestLines = lines.slice(-limit).reverse();

    const parsedLogs = latestLines.map((raw, idx) => {
      const match = raw.match(/^\[(.*?)\]\s*\[(.*?)\]\s*(.*)$/);
      if (match) {
        return {
          id: `${stat.mtimeMs}_${idx}`,
          timestamp: match[1],
          level: match[2],
          message: match[3],
          raw,
        };
      }
      return {
        id: `${stat.mtimeMs}_${idx}`,
        timestamp: '',
        level: type === 'error' ? 'ERROR' : 'INFO',
        message: raw,
        raw,
      };
    });

    return res.json({
      type,
      totalLines: lines.length,
      limit,
      fileSizeFormatted,
      logs: parsedLogs,
    });
  } catch (err: any) {
    logger.error('Failed to read system logs:', err);
    return res.status(500).json({ message: 'Ошибка чтения системных логов' });
  }
};

/**
 * Admin endpoint to clear system log files
 */
export const clearSystemLogs = async (req: AuthRequest, res: Response) => {
  try {
    const type = String(req.body?.type || req.query?.type || 'error').toLowerCase();

    const clearFile = async (name: string) => {
      const p = path.join(logsDir, name);
      if (fs.existsSync(p)) {
        await fs.promises.writeFile(p, '', 'utf-8');
      }
    };

    if (type === 'all') {
      await clearFile('error.log');
      await clearFile('access.log');
      await clearFile('frontend.log');
    } else if (type === 'access') {
      await clearFile('access.log');
    } else if (type === 'frontend') {
      await clearFile('frontend.log');
    } else {
      await clearFile('error.log');
    }

    logger.info(`Logs cleared by admin: type=${type}`);
    return res.json({ status: 'ok', message: `Файл логов (${type}) успешно очищен` });
  } catch (err: any) {
    logger.error('Failed to clear system logs:', err);
    return res.status(500).json({ message: 'Ошибка очистки логов' });
  }
};

