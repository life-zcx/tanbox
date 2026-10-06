import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, companyName, binIin, phone, consent } = req.body;

    if (consent === false) {
      return res.status(400).json({
        message: 'Регистрация невозможна без согласия на сбор и обработку персональных данных (Закон РК № 94-V)',
      });
    }

    if (!email || !password || !companyName || !binIin || !phone) {
      return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Пароль должен содержать минимум 8 символов' });
    }

    const binDigits = binIin.replace(/\D/g, '');
    if (binDigits.length !== 12) {
      return res.status(400).json({ message: 'БИН/ИИН должен содержать ровно 12 цифр' });
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 12) {
      return res.status(400).json({ message: 'Укажите корректный номер телефона (10–11 цифр)' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const phoneLast10 = phoneDigits.slice(-10);

    // Безопасная проверка на существование учетной записи по email, БИН/ИИН или телефону
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: 'insensitive' } },
          { binIin: binDigits },
          { binIin: binIin.trim() },
          { phone: phone.trim() },
          { phone: { contains: phoneLast10 } },
        ],
      },
    });

    if (existing) {
      if (existing.email.toLowerCase() === cleanEmail) {
        return res.status(409).json({
          code: 'EMAIL_EXISTS',
          message: 'Пользователь с таким e-mail уже зарегистрирован. Пожалуйста, выполните вход.',
        });
      }
      if (existing.binIin === binDigits || existing.binIin === binIin.trim()) {
        return res.status(409).json({
          code: 'BIN_EXISTS',
          message: 'Организация с таким БИН/ИИН уже зарегистрирована. Если это ваша компания, выполните вход в аккаунт.',
        });
      }
      return res.status(409).json({
        code: 'PHONE_EXISTS',
        message: 'Пользователь с таким номером телефона уже зарегистрирован. Пожалуйста, выполните вход.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        companyName: companyName.trim(),
        binIin: binDigits,
        phone: phone.trim(),
        role: 'CLIENT',
      },
    });

    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        companyName: newUser.companyName,
        binIin: newUser.binIin,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Регистрация прошла успешно',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        companyName: newUser.companyName,
        binIin: newUser.binIin,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Укажите email и пароль' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        binIin: user.binIin,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Успешный вход в систему',
      token,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName,
        binIin: user.binIin,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Ошибка сервера при авторизации' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        companyName: true,
        binIin: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};
