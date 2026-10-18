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
  isBlocked: boolean;
  blockedReason: string | null;
  tokenVersion: number;
  cachedAt: number;
}

const userBlockCache = new Map<string, CachedUserStatus>();
const CACHE_TTL_MS = 15000; // 15 seconds

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

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as any;
    req.user = decoded;

    // Verify account active status and token version in DB (blocked or invalidated sessions are rejected)
    if (decoded?.id) {
      const now = Date.now();
      const cached = userBlockCache.get(decoded.id);

      if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
        if (cached.isBlocked) {
          return res.status(403).json({
            code: 'USER_BLOCKED',
            message: cached.blockedReason
              ? `Ваш аккаунт заблокирован. Причина: ${cached.blockedReason}`
              : 'Ваш аккаунт заблокирован администратором платформы',
          });
        }
        if (typeof decoded.tokenVersion === 'number' && decoded.tokenVersion !== cached.tokenVersion) {
          return res.status(401).json({
            code: 'SESSION_REVOKED',
            message: 'Сессия аннулирована в связи со сменой пароля. Пожалуйста, выполните вход повторно.',
          });
        }
      } else {
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, isBlocked: true, blockedReason: true, tokenVersion: true },
        });

        if (!dbUser) {
          return res.status(401).json({ message: 'Пользователь не найден или был удален' });
        }

        userBlockCache.set(decoded.id, {
          isBlocked: dbUser.isBlocked,
          blockedReason: dbUser.blockedReason,
          tokenVersion: dbUser.tokenVersion,
          cachedAt: now,
        });

        if (dbUser.isBlocked) {
          return res.status(403).json({
            code: 'USER_BLOCKED',
            message: dbUser.blockedReason
              ? `Ваш аккаунт заблокирован. Причина: ${dbUser.blockedReason}`
              : 'Ваш аккаунт заблокирован администратором платформы',
          });
        }

        if (typeof decoded.tokenVersion === 'number' && decoded.tokenVersion !== dbUser.tokenVersion) {
          return res.status(401).json({
            code: 'SESSION_REVOKED',
            message: 'Сессия аннулирована в связи со сменой пароля. Пожалуйста, выполните вход повторно.',
          });
        }
      }
    }

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Недействительный или просроченный токен' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== Role.ADMIN) {
    return res.status(403).json({ message: 'Доступ разрешен только администраторам' });
  }
  next();
};
