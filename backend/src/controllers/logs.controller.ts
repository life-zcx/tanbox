import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export const handleFrontendLogs = (req: Request, res: Response) => {
  try {
    const { level = 'info', message, meta, userAgent, url } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Поле message обязательно' });
    }

    logger.frontend(level, message, {
      ...meta,
      url,
      clientIp: req.ip || req.headers['x-forwarded-for'],
      userAgent: userAgent || req.headers['user-agent'],
    });

    return res.status(200).json({ status: 'ok' });
  } catch (err: any) {
    logger.error('Failed to log frontend message', err);
    return res.status(500).json({ message: 'Ошибка сохранения логов' });
  }
};
