import { Request, Response } from 'express';
import { logger } from '../utils/logger';

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

    return res.status(200).json({ status: 'ok' });
  } catch (err: any) {
    logger.error('Failed to log frontend message', err);
    return res.status(500).json({ message: 'Ошибка сохранения логов' });
  }
};
