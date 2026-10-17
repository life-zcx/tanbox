import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendVerificationOtpEmail, sendPasswordResetOtpEmail, sendAdminLoginOtpEmail } from '../services/email.service';
import { clientTelegramBot } from '../services/clientTelegram.service';
import { logger } from '../utils/logger';

// In-memory rate limiting / anti-abuse store
const memoryCooldowns = new Map<string, number>();
const memoryAttempts = new Map<string, number>();

// Periodic cleanup: evict stale cooldowns/attempts and expired DB codes (every 10 minutes)
setInterval(async () => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [key, timestamp] of memoryCooldowns.entries()) {
    if (timestamp < cutoff) {
      memoryCooldowns.delete(key);
      memoryAttempts.delete(key);
    }
  }
  try {
    await prisma.verificationCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  } catch {}
}, 10 * 60 * 1000);

/**
 * STEP 1: Validate registration data, generate 6-digit OTP code, and send verification email
 */
export const sendRegisterCode = async (req: Request, res: Response) => {
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Укажите корректный адрес электронной почты' });
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

    // Check if user already exists by email, BIN or phone
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

    // Anti-spam 60-second cooldown per email
    const now = Date.now();
    const lastSent = memoryCooldowns.get(cleanEmail);
    if (lastSent && now - lastSent < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
      return res.status(429).json({
        message: `Код подтверждения уже был отправлен. Пожалуйста, подождите ${waitSec} сек. перед повторной отправкой.`,
        cooldownRemaining: waitSec,
      });
    }

    // Generate cryptographic 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in database
    await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
    await prisma.verificationCode.create({
      data: {
        email: cleanEmail,
        code,
        expiresAt,
      },
    });

    // Reset attempt counter on fresh code
    memoryAttempts.delete(cleanEmail);
    memoryCooldowns.set(cleanEmail, now);

    // Send email via SMTP
    await sendVerificationOtpEmail(cleanEmail, code);

    return res.json({
      success: true,
      message: `Код подтверждения успешно отправлен на ${cleanEmail}`,
      expiresInMinutes: 10,
      cooldownSeconds: 60,
    });
  } catch (error: any) {
    logger.error('sendRegisterCode error:', error);
    return res.status(500).json({ message: 'Ошибка при отправке кода подтверждения на почту' });
  }
};

/**
 * STEP 2: Verify 6-digit OTP code and create User account
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, companyName, binIin, phone, consent, code } = req.body;

    if (consent === false) {
      return res.status(400).json({
        message: 'Регистрация невозможна без согласия на сбор и обработку персональных данных (Закон РК № 94-V)',
      });
    }

    if (!email || !password || !companyName || !binIin || !phone) {
      return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    }

    if (!code) {
      return res.status(400).json({ message: 'Пожалуйста, введите 6-значный код подтверждения из письма' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim();

    // 1. Check anti-bruteforce attempts
    const attempts = memoryAttempts.get(cleanEmail) || 0;
    if (attempts >= 5) {
      await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
      memoryAttempts.delete(cleanEmail);
      return res.status(429).json({
        message: 'Превышено максимальное число неверных попыток. Код аннулирован. Запросите новый код.',
      });
    }

    // 2. Validate OTP code in DB
    const tokenRecord = await prisma.verificationCode.findFirst({
      where: { email: cleanEmail, code: cleanCode },
    });

    if (!tokenRecord) {
      memoryAttempts.set(cleanEmail, attempts + 1);
      const remaining = 5 - (attempts + 1);
      return res.status(400).json({
        message: `Неверный код подтверждения. Осталось попыток: ${remaining}`,
      });
    }

    // 3. Check expiration
    if (new Date() > tokenRecord.expiresAt) {
      await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
      return res.status(400).json({
        message: 'Срок действия кода подтверждения истек (10 минут). Пожалуйста, запросите новый код.',
      });
    }

    const binDigits = binIin.replace(/\D/g, '');
    const phoneDigits = phone.replace(/\D/g, '');

    // Check unique constraints one more time
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: 'insensitive' } },
          { binIin: binDigits },
        ],
      },
    });

    if (existing) {
      await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
      return res.status(409).json({
        message: 'Пользователь или организация с такими данными уже зарегистрирована. Выполните вход.',
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

    // Cleanup used verification code and counters
    await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
    memoryAttempts.delete(cleanEmail);
    memoryCooldowns.delete(cleanEmail);

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
      message: 'Регистрация успешно завершена',
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
    logger.error('Register error:', error);
    return res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, code, isAdminPanel } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Укажите email и пароль' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Check account block status
    if (user.isBlocked) {
      return res.status(403).json({
        code: 'USER_BLOCKED',
        message: user.blockedReason
          ? `Ваш аккаунт заблокирован. Причина: ${user.blockedReason}`
          : 'Ваш аккаунт заблокирован администратором платформы. Для разблокировки свяжитесь с поддержкой TANBOX.',
      });
    }

    // Two-Factor Authentication (2FA via Email OTP) for all ADMIN accounts
    if (user.role === 'ADMIN') {
      const now = Date.now();
      const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '—';

      // STEP 1: If OTP code was not yet supplied, generate code and send email
      if (!code) {
        const lastSent = memoryCooldowns.get(`admin_otp_${cleanEmail}`);
        if (lastSent && now - lastSent < 60 * 1000) {
          const waitSec = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
          return res.status(200).json({
            requireOtp: true,
            email: cleanEmail,
            message: `Код подтверждения уже отправлен. Подождите ${waitSec} сек. перед повторной отправкой.`,
            cooldownRemaining: waitSec,
          });
        }

        const otpCode = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
        await prisma.verificationCode.create({
          data: {
            email: cleanEmail,
            code: otpCode,
            expiresAt,
          },
        });

        memoryCooldowns.set(`admin_otp_${cleanEmail}`, now);
        memoryAttempts.delete(`admin_otp_${cleanEmail}`);

        await sendAdminLoginOtpEmail(cleanEmail, otpCode, { ip });

        return res.status(200).json({
          requireOtp: true,
          email: cleanEmail,
          message: `Код подтверждения отправлен на почту ${cleanEmail}`,
          cooldownRemaining: 60,
        });
      }

      // STEP 2: Verify supplied OTP code
      const cleanCode = String(code).trim().replace(/\D/g, '');
      const attemptsKey = `admin_otp_${cleanEmail}`;
      const currentAttempts = (memoryAttempts.get(attemptsKey) || 0) + 1;
      memoryAttempts.set(attemptsKey, currentAttempts);

      if (currentAttempts > 5) {
        await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
        memoryCooldowns.delete(`admin_otp_${cleanEmail}`);
        memoryAttempts.delete(attemptsKey);
        return res.status(429).json({
          message: 'Слишком много неверных попыток ввода кода. Пожалуйста, начните вход заново.',
        });
      }

      const storedCode = await prisma.verificationCode.findFirst({
        where: { email: cleanEmail },
        orderBy: { createdAt: 'desc' },
      });

      if (!storedCode || storedCode.code !== cleanCode) {
        const remaining = 5 - currentAttempts;
        return res.status(400).json({
          message: `Неверный код подтверждения из письма. Осталось попыток: ${remaining > 0 ? remaining : 0}`,
        });
      }

      if (new Date() > storedCode.expiresAt) {
        await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
        return res.status(400).json({
          message: 'Срок действия кода подтверждения истек (10 минут). Запросите новый код.',
        });
      }

      // OTP verified successfully
      await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
      memoryAttempts.delete(attemptsKey);
      memoryCooldowns.delete(`admin_otp_${cleanEmail}`);
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
        balance: Number(user.balance || 0),
      },
    });
  } catch (error: any) {
    logger.error('Login error:', error);
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
        isBlocked: true,
        blockedReason: true,
        telegramChatId: true,
        telegramUsername: true,
        telegramLinkedAt: true,
        balance: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        code: 'USER_BLOCKED',
        message: 'Ваш аккаунт заблокирован',
      });
    }

    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const { phone, currentPassword, newPassword } = req.body;
    const updateData: any = {};

    if (phone !== undefined) {
      const phoneDigits = String(phone).replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 12) {
        return res.status(400).json({ message: 'Номер телефона должен содержать 10–11 цифр' });
      }
      updateData.phone = String(phone).trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Для смены пароля введите текущий пароль' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Новый пароль должен содержать минимум 8 символов' });
      }

      const existingUser = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!existingUser) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      const isMatch = await bcrypt.compare(currentPassword, existingUser.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Неверный текущий пароль' });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Нет данных для обновления' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
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

    return res.json({ message: 'Профиль успешно обновлен', user: updatedUser });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Ошибка обновления профиля' });
  }
};

/**
 * STEP 1 FORGOT PASSWORD: Send 6-digit OTP to user's verified email
 */
export const sendForgotPasswordCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Укажите email' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      // Return success response to prevent email enumeration
      return res.json({
        success: true,
        message: 'Если учетная запись с таким email существует, код для сброса пароля отправлен на почту.',
        cooldownSeconds: 60,
      });
    }

    const now = Date.now();
    const lastSent = memoryCooldowns.get(cleanEmail);
    if (lastSent && now - lastSent < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
      return res.status(429).json({
        message: `Код подтверждения уже был отправлен. Подождите ${waitSec} сек.`,
        cooldownRemaining: waitSec,
      });
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
    await prisma.verificationCode.create({
      data: {
        email: cleanEmail,
        code,
        expiresAt,
      },
    });

    memoryAttempts.delete(cleanEmail);
    memoryCooldowns.set(cleanEmail, now);

    await sendPasswordResetOtpEmail(cleanEmail, code);

    return res.json({
      success: true,
      message: `Код для восстановления пароля отправлен на ${cleanEmail}`,
      expiresInMinutes: 10,
      cooldownSeconds: 60,
    });
  } catch (error: any) {
    logger.error('sendForgotPasswordCode error:', error);
    return res.status(500).json({ message: 'Ошибка при отправке кода сброса пароля' });
  }
};

/**
 * STEP 2 FORGOT PASSWORD: Validate OTP and set new password
 */
export const resetPasswordWithCode = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, код подтверждения и новый пароль обязательны' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'Новый пароль должен содержать минимум 8 символов' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    const attempts = memoryAttempts.get(cleanEmail) || 0;
    if (attempts >= 5) {
      await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
      memoryAttempts.delete(cleanEmail);
      return res.status(429).json({
        message: 'Превышено максимальное число неверных попыток. Код аннулирован. Запросите новый код.',
      });
    }

    const tokenRecord = await prisma.verificationCode.findFirst({
      where: { email: cleanEmail, code: cleanCode },
    });

    if (!tokenRecord) {
      memoryAttempts.set(cleanEmail, attempts + 1);
      const remaining = 5 - (attempts + 1);
      return res.status(400).json({
        message: `Неверный код подтверждения. Осталось попыток: ${remaining}`,
      });
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
      return res.status(400).json({
        message: 'Срок действия кода подтверждения истек (10 минут). Запросите новый код.',
      });
    }

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword).trim(), 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
    memoryAttempts.delete(cleanEmail);
    memoryCooldowns.delete(cleanEmail);

    return res.json({
      success: true,
      message: 'Пароль успешно изменен. Теперь вы можете войти в систему с новым паролем.',
    });
  } catch (error: any) {
    logger.error('resetPasswordWithCode error:', error);
    return res.status(500).json({ message: 'Ошибка сервера при сбросе пароля' });
  }
};

/**
 * GET /api/auth/me/telegram-status
 * Получить статус привязки Telegram для текущего пользователя
 */
export const getTelegramStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const user = await (prisma as any).user.findUnique({
      where: { id: req.user.id },
      select: {
        telegramChatId: true,
        telegramUsername: true,
        telegramLinkedAt: true,
      },
    });

    return res.json({
      isLinked: Boolean(user?.telegramChatId),
      username: user?.telegramUsername || null,
      linkedAt: user?.telegramLinkedAt || null,
      botUsername: clientTelegramBot.getBotUsername(),
    });
  } catch (error: any) {
    logger.error('getTelegramStatus error:', error);
    return res.status(500).json({ message: 'Ошибка получения статуса Telegram' });
  }
};

/**
 * POST /api/auth/me/telegram-link
 * Сгенерировать ссылку привязки Telegram бота
 */
export const createTelegramLink = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const { link, token } = await clientTelegramBot.generateAuthLink(req.user.id);

    return res.json({
      success: true,
      link,
      token,
      botUsername: clientTelegramBot.getBotUsername(),
      message: 'Ссылка для привязки Telegram бота сгенерирована',
    });
  } catch (error: any) {
    logger.error('createTelegramLink error:', error);
    return res.status(500).json({ message: 'Ошибка генерации ссылки Telegram' });
  }
};

/**
 * POST /api/auth/me/telegram-unlink
 * Отвязать Telegram бота
 */
export const unlinkTelegram = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    await clientTelegramBot.unlinkUser(req.user.id);

    return res.json({
      success: true,
      message: 'Telegram успешно отвязан от вашего аккаунта',
    });
  } catch (error: any) {
    logger.error('unlinkTelegram error:', error);
    return res.status(500).json({ message: 'Ошибка отвязки Telegram' });
  }
};


