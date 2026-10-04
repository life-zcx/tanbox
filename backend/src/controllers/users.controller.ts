import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';
import { logger } from '../utils/logger';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        companyName: true,
        binIin: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            stickerTemplates: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(users);
  } catch (error: any) {
    logger.error('getUsers error:', error);
    return res.status(500).json({ message: 'Ошибка при получении списка пользователей' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        companyName: true,
        binIin: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            category: true,
            tariffType: true,
            itemsCount: true,
            totalPrice: true,
            status: true,
            paymentStatus: true,
            printAllowed: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
        stickerTemplates: {
          select: {
            id: true,
            name: true,
            widthMm: true,
            heightMm: true,
            category: true,
            elements: true,
            previewUrl: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        },
        _count: {
          select: {
            orders: true,
            stickerTemplates: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const totalSpent = user.orders.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    return res.json({
      ...user,
      totalSpent,
    });
  } catch (error: any) {
    logger.error('getUserById error:', error);
    return res.status(500).json({ message: 'Ошибка при получении карточки пользователя' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Доступ разрешен только администраторам' });
    }

    const { id } = req.params;
    const { companyName, binIin, email, phone, role, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const updateData: any = {};

    // 1. Role validation & Safety against lockouts
    if (role !== undefined) {
      if (role !== Role.ADMIN && role !== Role.CLIENT) {
        return res.status(400).json({ message: 'Недопустимая роль. Доступные значения: CLIENT, ADMIN' });
      }

      // Prevent self-demotion
      if (req.user.id === existingUser.id && role === Role.CLIENT) {
        return res.status(400).json({
          message: 'Нельзя отозвать права администратора у самого себя во избежание потери доступа',
        });
      }

      // Prevent demoting the last remaining admin
      if (existingUser.role === Role.ADMIN && role === Role.CLIENT) {
        const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
        if (adminCount <= 1) {
          return res.status(400).json({
            message: 'Нельзя отозвать права у единственного администратора системы',
          });
        }
      }

      updateData.role = role;
    }

    // 2. Company Name validation
    if (companyName !== undefined) {
      if (typeof companyName !== 'string' || !companyName.trim()) {
        return res.status(400).json({ message: 'Название компании не может быть пустым' });
      }
      updateData.companyName = companyName.trim().slice(0, 200);
    }

    // 3. BIN/IIN validation
    if (binIin !== undefined) {
      const cleanBin = String(binIin).replace(/\D/g, '');
      if (cleanBin.length !== 12) {
        return res.status(400).json({ message: 'БИН/ИИН должен содержать ровно 12 цифр' });
      }
      updateData.binIin = cleanBin;
    }

    // 4. Email validation and uniqueness check
    if (email !== undefined) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        return res.status(400).json({ message: 'Укажите корректный адрес электронной почты' });
      }

      const emailConflict = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          id: { not: id },
        },
      });
      if (emailConflict) {
        return res.status(400).json({ message: 'Пользователь с таким email уже зарегистрирован' });
      }

      updateData.email = cleanEmail;
    }

    // 5. Phone validation
    if (phone !== undefined) {
      const cleanPhone = String(phone).trim();
      if (!cleanPhone) {
        return res.status(400).json({ message: 'Телефон не может быть пустым' });
      }
      updateData.phone = cleanPhone.slice(0, 50);
    }

    // 6. Optional Password reset / change
    if (password !== undefined && password !== null && String(password).trim().length > 0) {
      const cleanPassword = String(password).trim();
      if (cleanPassword.length < 8) {
        return res.status(400).json({ message: 'Новый пароль должен содержать минимум 8 символов' });
      }
      updateData.password = await bcrypt.hash(cleanPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        companyName: true,
        binIin: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true, stickerTemplates: true },
        },
      },
    });

    logger.info(`Admin ${req.user.email} updated user ${updatedUser.email} (role: ${updatedUser.role})`);

    return res.json({
      message: 'Данные клиента успешно сохранены',
      user: updatedUser,
    });
  } catch (error: any) {
    logger.error('updateUser error:', error);
    return res.status(500).json({ message: 'Ошибка при обновлении данных пользователя' });
  }
};
