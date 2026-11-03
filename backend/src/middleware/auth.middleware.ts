import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    companyName: string;
    binIin: string;
    phone?: string;
  };
}

import { prisma } from '../config/db';

interface CachedUserStatus {
  profile: NonNullable<AuthRequest['user']>;
  isBlocked: boolean;
  blockedReason: string | null;
  tokenVersion: number;
  cachedAt: number;
}

const userBlockCache = new Map<string, CachedUserStatus>();
const CACHE_TTL_MS = 15000; // 15 seconds
const MAX_CACHE_ENTRIES = 5000;

// Periodic cleanup of stale cached entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userBlockCache.entries()) {
    if (now - value.cachedAt >= CACHE_TTL_MS) {
      userBlockCache.delete(key);
    }
  }
}, 60000).unref();

export const invalidateUserBlockCache = (userId: string) => {
  userBlockCache.delete(userId);
};

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Авторизация отсутствует' });
  }

  let decoded: jwt.JwtPayload;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || typeof payload.id !== 'string' || !payload.id) {
      return res.status(401).json({ message: 'Недействительный токен' });
    }
    decoded = payload;
  } catch {
    return res.status(401).json({ message: 'Недействительный или просроченный токен' });
  }

  try {

    // Verify account active status and token version in DB (blocked or invalidated sessions are rejected)
    if (decoded?.id) {
      const now = Date.now();
      const tokenVersion = typeof decoded.tokenVersion === 'number' ? decoded.tokenVersion : 0;
      const cached = userBlockCache.get(decoded.id);

      if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
        req.user = cached.profile;
        if (cached.isBlocked) {
          return res.status(403).json({
            code: 'USER_BLOCKED',
            message: cached.blockedReason
              ? `Ваш аккаунт заблокирован. Причина: ${cached.blockedReason}`
              : 'Ваш аккаунт заблокирован администратором платформы',
          });
        }
        if (tokenVersion !== cached.tokenVersion) {
          return res.status(401).json({
            code: 'SESSION_REVOKED',
            message: 'Сессия аннулирована в связи со сменой пароля. Пожалуйста, выполните вход повторно.',
          });
        }
      } else {
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, email: true, role: true, companyName: true, binIin: true, phone: true, isBlocked: true, blockedReason: true, tokenVersion: true },
        });

        if (!dbUser) {
          return res.status(401).json({ message: 'Пользователь не найден или был удален' });
        }

        // Bounded insertion to prevent uncontrolled growth
        if (userBlockCache.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = userBlockCache.keys().next().value;
          if (oldestKey) userBlockCache.delete(oldestKey);
        }

        userBlockCache.set(decoded.id, {
          profile: { id: dbUser.id, email: dbUser.email, role: dbUser.role, companyName: dbUser.companyName, binIin: dbUser.binIin, phone: dbUser.phone },
          isBlocked: dbUser.isBlocked,
          blockedReason: dbUser.blockedReason,
          tokenVersion: dbUser.tokenVersion,
          cachedAt: now,
        });
        req.user = { id: dbUser.id, email: dbUser.email, role: dbUser.role, companyName: dbUser.companyName, binIin: dbUser.binIin, phone: dbUser.phone };

        if (dbUser.isBlocked) {
          return res.status(403).json({
            code: 'USER_BLOCKED',
            message: dbUser.blockedReason
              ? `Ваш аккаунт заблокирован. Причина: ${dbUser.blockedReason}`
              : 'Ваш аккаунт заблокирован администратором платформы',
          });
        }

        if (tokenVersion !== dbUser.tokenVersion) {
          return res.status(401).json({
            code: 'SESSION_REVOKED',
            message: 'Сессия аннулирована в связи со сменой пароля. Пожалуйста, выполните вход повторно.',
          });
        }
      }
    }

    next();
  } catch (error) {
    return res.status(503).json({ message: 'Сервис авторизации временно недоступен. Повторите попытку.' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== Role.ADMIN) {
    return res.status(403).json({ message: 'Доступ разрешен только администраторам' });
  }
  next();
};
