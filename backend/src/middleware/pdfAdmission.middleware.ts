import { RequestHandler } from 'express';
import { AuthRequest } from './auth.middleware';

let active = 0;
const byUser = new Map<string, number>();
export function limitHeavyRequests(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    const key = (req as AuthRequest).user?.id || req.ip || 'anonymous';
    if (active >= 2 || (byUser.get(key) || 0) >= 1) {
      res.status(429).json({ message: 'Сервис занят. Повторите запрос после завершения текущей операции.' }); return;
    }
    active++; byUser.set(key, (byUser.get(key) || 0) + 1);
    let released = false;
    let timeout: ReturnType<typeof setTimeout>;
    const release = () => {
      if (released) return; released = true; active--;
      clearTimeout(timeout);
      const count = (byUser.get(key) || 1) - 1;
      if (count) byUser.set(key, count); else byUser.delete(key);
    };
    timeout = setTimeout(() => {
      if (!res.headersSent) res.status(504).json({ message: 'Операция превысила допустимое время. Проверьте её статус перед повтором.' });
      res.destroy?.(); req.destroy?.(); release();
    }, 300000);
    timeout.unref();
    res.once('finish', release); res.once('close', release);
    try { Promise.resolve(handler(req, res, next)).catch(error => { release(); next(error); }); }
    catch (error) { release(); next(error); }
  };
}
export const limitPdfRequests = limitHeavyRequests;
