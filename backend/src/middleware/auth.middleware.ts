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
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
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
