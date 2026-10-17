import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { AuthRequest, invalidateUserBlockCache } from '../middleware/auth.middleware';
import { Role, OnlinePaymentType, OnlinePaymentStatus, OrderStatus } from '@prisma/client';
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
        balance: true,
        isBlocked: true,
        blockedReason: true,
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
        balance: true,
        isBlocked: true,
        blockedReason: true,
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

    // Accurate aggregate across ALL client orders (not capped by pagination/take: 30)
    const totalSpentAgg = await prisma.order.aggregate({
      where: {
        userId: id,
        status: { not: OrderStatus.CANCELLED },
      },
      _sum: {
        totalPrice: true,
      },
    });

    const totalSpent = Number(totalSpentAgg._sum.totalPrice || 0);

    const safeOrders = user.orders.map((o) => ({
      ...o,
      totalPrice: Number(o.totalPrice || 0),
    }));

    return res.json({
      ...user,
      orders: safeOrders,
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

/**
 * Блокировка / разблокировка учетной записи пользователя
 */
export const toggleBlockUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Доступ разрешен только администраторам' });
    }

    const { id } = req.params;
    const { isBlocked, blockedReason } = req.body;

    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({ message: 'Параметр isBlocked должен быть булевым значением (true/false)' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Защита: нельзя заблокировать самого себя
    if (req.user.id === targetUser.id) {
      return res.status(400).json({ message: 'Нельзя заблокировать собственную учетную запись' });
    }

    // Защита: нельзя заблокировать единственного активного администратора
    if (targetUser.role === Role.ADMIN && isBlocked) {
      const activeAdminsCount = await prisma.user.count({
        where: { role: Role.ADMIN, isBlocked: false },
      });
      if (activeAdminsCount <= 1) {
        return res.status(400).json({ message: 'Нельзя заблокировать единственного активного администратора системы' });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isBlocked,
        blockedReason: isBlocked ? (blockedReason ? String(blockedReason).trim().slice(0, 500) : 'Блокировка администратором') : null,
      },
      select: {
        id: true,
        email: true,
        companyName: true,
        binIin: true,
        phone: true,
        role: true,
        isBlocked: true,
        blockedReason: true,
        updatedAt: true,
      },
    });

    invalidateUserBlockCache(id);
    logger.info(`Admin ${req.user.email} ${isBlocked ? 'BLOCKED' : 'UNBLOCKED'} user ${updated.email}`);

    return res.json({
      success: true,
      message: isBlocked ? 'Пользователь успешно заблокирован' : 'Пользователь успешно разблокирован',
      user: updated,
    });
  } catch (error: any) {
    logger.error('toggleBlockUser error:', error);
    return res.status(500).json({ message: 'Ошибка при изменении статуса блокировки пользователя' });
  }
};

/**
 * Полное удаление учетной записи пользователя из системы
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Доступ разрешен только администраторам' });
    }

    const { id } = req.params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, companyName: true },
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Защита: нельзя удалить самого себя
    if (req.user.id === targetUser.id) {
      return res.status(400).json({ message: 'Вы не можете удалить собственный аккаунт' });
    }

    // Защита: нельзя удалить единственного администратора
    if (targetUser.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Нельзя удалить единственного администратора системы' });
      }
    }

    // Очистка кодов подтверждения
    await prisma.verificationCode.deleteMany({ where: { email: targetUser.email } });

    // Каскадное удаление через Prisma onDelete: Cascade
    await prisma.user.delete({ where: { id } });

    invalidateUserBlockCache(id);
    logger.info(`Admin ${req.user.email} DELETED user ${targetUser.email} (id: ${id})`);

    return res.json({
      success: true,
      message: `Пользователь ${targetUser.email} (${targetUser.companyName}) успешно удален`,
    });
  } catch (error: any) {
    logger.error('deleteUser error:', error);
    return res.status(500).json({ message: 'Ошибка при удалении аккаунта пользователя' });
  }
};

/**
 * POST /api/users/:id/balance
 * Admin adjusts (tops up or decrements) user balance with audit trail
 */
export const adjustUserBalance = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Доступ разрешен только администраторам' });
    }

    const { id } = req.params;
    const { amount, action = 'ADD', comment } = req.body;

    const numAmount = Math.round(Number(amount));
    if (!numAmount || numAmount <= 0 || isNaN(numAmount)) {
      return res.status(400).json({ message: 'Сумма операции должна быть положительным числом' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, balance: true, email: true, companyName: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const currentBalance = Number(user.balance);
    if (action === 'SUBTRACT' && currentBalance < numAmount) {
      return res.status(400).json({
        message: `Невозможно списать ${numAmount.toLocaleString('ru-RU')} ₸. Текущий баланс пользователя: ${currentBalance.toLocaleString('ru-RU')} ₸`,
      });
    }

    const isAdd = action === 'ADD';
    const timestamp = Date.now().toString().slice(-8);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const paymentNumber = `TB-ADM-${timestamp}-${randomSuffix}`;
    const cleanComment = typeof comment === 'string' && comment.trim()
      ? comment.trim().slice(0, 300)
      : (isAdd ? 'Ручное пополнение администратором' : 'Ручное списание администратором');

    const [updatedUser, paymentRecord] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          balance: isAdd ? { increment: numAmount } : { decrement: numAmount },
        },
        select: {
          id: true,
          email: true,
          companyName: true,
          balance: true,
        },
      }),
      prisma.onlinePayment.create({
        data: {
          paymentNumber,
          userId: id,
          type: OnlinePaymentType.BALANCE,
          amount: numAmount,
          currency: 'KZT',
          status: OnlinePaymentStatus.PAID,
          description: `${isAdd ? 'Пополнение баланса' : 'Списание с баланса'}: ${cleanComment}`,
          pgPaymentDate: new Date(),
          metadata: {
            manualByAdmin: true,
            action: isAdd ? 'CREDIT' : 'DEBIT',
            adminId: req.user.id,
            adminEmail: req.user.email,
            comment: cleanComment,
            previousBalance: currentBalance,
            newBalance: isAdd ? currentBalance + numAmount : currentBalance - numAmount,
          },
        },
      }),
    ]);

    logger.info(`[Admin Balance] Admin ${req.user.email} adjusted balance for user ${user.email}: ${action} ${numAmount} KZT. New balance: ${updatedUser.balance}`);

    return res.json({
      success: true,
      message: `Баланс успешно ${isAdd ? 'пополнен на' : 'уменьшен на'} ${numAmount.toLocaleString('ru-RU')} ₸`,
      newBalance: Number(updatedUser.balance),
      user: updatedUser,
      payment: paymentRecord,
    });
  } catch (error: any) {
    logger.error('adjustUserBalance error:', error);
    return res.status(500).json({ message: 'Ошибка при корректировке баланса: ' + error.message });
  }
};

/**
 * GET /api/users/:id/balance-history
 * Returns full transaction history for a user
 */
export const getUserBalanceHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Доступ разрешен только администраторам' });
    }

    const { id } = req.params;

    const payments = await prisma.onlinePayment.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalPrice: true,
            status: true,
          },
        },
      },
    });

    const formatted = payments.map((p) => {
      const meta = (p.metadata as any) || {};
      const isManual = Boolean(meta.manualByAdmin);
      const isBalanceDebit = meta.paidVia === 'BALANCE' || meta.paidViaBalance === true || meta.action === 'DEBIT';
      const isBalanceCredit = p.type === OnlinePaymentType.BALANCE && meta.action !== 'DEBIT';

      let direction: 'IN' | 'OUT' = isBalanceCredit ? 'IN' : 'OUT';
      if (!isBalanceCredit && !isBalanceDebit) {
        // Direct card payments
        direction = 'IN';
      }

      let category = 'OTHER';
      if (isManual) {
        category = meta.action === 'DEBIT' ? 'ADMIN_DEBIT' : 'ADMIN_TOPUP';
      } else if (p.type === OnlinePaymentType.BALANCE) {
        category = 'ONLINE_TOPUP';
      } else if (p.type === OnlinePaymentType.ORDER) {
        category = 'ORDER_PAYMENT';
      } else if (p.type === OnlinePaymentType.STICKER_LAYOUT) {
        category = 'LAYOUT_PAYMENT';
      }

      return {
        id: p.id,
        paymentNumber: p.paymentNumber,
        type: p.type,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        description: p.description,
        createdAt: p.createdAt,
        direction,
        category,
        order: p.order,
        metadata: meta,
      };
    });

    return res.json({
      history: formatted,
    });
  } catch (error: any) {
    logger.error('getUserBalanceHistory error:', error);
    return res.status(500).json({ message: 'Ошибка при получении истории баланса: ' + error.message });
  }
};
