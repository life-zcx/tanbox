# Полное руководство: Регистрация с подтверждением кода по Email (OTP)

Готовый модуль для переноса в любой fullstack-проект (Node.js/Express + React/Vite + Prisma/PostgreSQL).

---

## Содержание
1. [Архитектура и логика работы](#1-архитектура-и-логика-работы)
2. [Необходимые npm-пакеты](#2-необходимые-npm-пакеты)
3. [Переменные окружения (.env)](#3-переменные-окружения-env)
4. [База данных (Prisma Schema)](#4-база-данных-prisma-schema)
5. [Бэкенд: Сервис отправки почты (email.js)](#5-бэкенд-сервис-отправки-почты-emailjs)
6. [Бэкенд: Контроллер регистрации (authController.js)](#6-бэкенд-контроллер-регистрации-authcontrollerjs)
7. [Бэкенд: Маршруты (authRoutes.js)](#7-бэкенд-маршруты-authroutesjs)
8. [Фронтенд: API клиент (api.js)](#8-фронтенд-api-клиент-apijs)
9. [Фронтенд: React Hook (useEmailAuth.js)](#9-фронтенд-react-hook-useemailauthjs)
10. [Фронтенд: UI Компонент формы (RegisterModal.jsx)](#10-фронтенд-ui-компонент-формы-registermodaljsx)
11. [Чеклист перед запуском](#11-чеклист-перед-запуском)

---

## 1. Архитектура и логика работы

Процесс состоит из двух шагов:

```
[Пользователь]                         [Frontend]                     [Backend]                     [SMTP/Email]
      │                                    │                              │                              │
      │── 1. Заполняет (Email, Pass, Name) ─>                             │                              │
      │                                    │── POST /send-register-code ─>│                              │
      │                                    │                              │── Проверка уникальности email │
      │                                    │                              │── Генерация 6-значного OTP   │
      │                                    │                              │── Сохранение в БД (exp 10m) ─│
      │                                    │                              │── Cooldown 60s (Redis/Memory)│
      │                                    │                              │── Отправка письма ──────────>│
      │                                    │<────────── 200 OK ───────────│                              │
      │                                    │                              │                              │──> [Письмо с кодом]
      │<── Переключение на экран OTP ──────│                              │
      │                                    │                              │
      │── 2. Вводит 6-значный код ─────────>                              │
      │                                    │── POST /register (с кодом) ─>│
      │                                    │                              │── Проверка попыток (max 5)   │
      │                                    │                              │── Проверка кода и exp date   │
      │                                    │                              │── Хеширование bcrypt         │
      │                                    │                              │── Создание User в БД         │
      │                                    │                              │── Удаление использованного OTP
      │                                    │                              │── Генерация JWT токенов      │
      │                                    │<── 201 Created + Token/User ─│
      │<── Успешный вход в аккаунт ────────│
```

---

## 2. Необходимые npm-пакеты

### Бэкенд:
```bash
npm install express nodemailer bcryptjs jsonwebtoken @prisma/client redis
npm install -D prisma
```

### Фронтенд:
```bash
npm install axios lucide-react
```

---

## 3. Переменные окружения (.env)

### `backend/.env`:
```env
# Сервер
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# База данных (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/my_project_db?schema=public"

# Авторизация (JWT)
JWT_SECRET=super_strong_secret_key_change_me_in_production_min_32_chars

# Почтовый SMTP сервер (Пример для Яндекс, Mail.ru или Gmail)
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=no-reply@yourdomain.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx # Спец. пароль приложения из настроек безопасности почты!

# Redis (опционально, для антиспама и ограничения попыток)
REDIS_URL=redis://localhost:6379
```

> **Важно по `SMTP_PASS`:** Для Яндекс/Gmail/Mail.ru создается в личном кабинете почты: `Безопасность -> Пароли приложений -> Создать пароль для почты`. Обычный пароль от входа не сработает.

### `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 4. База данных (Prisma Schema)

Добавьте в ваш `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  phone     String?
  role      String   @default("USER")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model VerificationCode {
  id        Int      @id @default(autoincrement())
  email     String
  code      String
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([email])
}
```

Примените миграцию:
```bash
npx prisma migrate dev --name add_auth_verification
```

---

## 5. Бэкенд: Сервис отправки почты (`email.js`)

Создайте файл `src/utils/email.js`:

```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: Number(process.env.SMTP_PORT) === 465, // true для 465, false для 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

export const sendEmail = async ({ to, subject, html }) => {
  // Заглушка для локальной разработки, если SMTP еще не настроен
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`\n⚠️ [EMAIL MOCK] SMTP не настроен. Письмо для ${to}:`);
    console.log(`Тема: ${subject}`);
    console.log(`Тело письма:\n${html}\n`);
    return { id: 'mock-id' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Ваш Проект" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return { id: info.messageId };
  } catch (error) {
    console.error('Ошибка отправки email через SMTP:', error.message);
    throw error;
  }
};
```

---

## 6. Бэкенд: Контроллер регистрации (`authController.js`)

Создайте файл `src/controllers/authController.js`:

```javascript
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../utils/email.js';

const prisma = new PrismaClient();

// Хранилище кулдаунов в памяти (если Redis не подключен)
const memoryCooldowns = new Map();
const memoryAttempts = new Map();

/**
 * ШАГ 1: Проверка данных и отправка 6-значного OTP кода
 */
export const sendRegisterCode = async (req, res) => {
  const { email, password, name, phone } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Пожалуйста, заполните обязательные поля (Имя, Email, Пароль)' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Неверный формат электронной почты' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Проверяем, не занят ли email
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован' });
    }

    // 2. Cooldown защита от частой отправки (1 минута)
    const now = Date.now();
    const lastSent = memoryCooldowns.get(cleanEmail);
    if (lastSent && now - lastSent < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
      return res.status(429).json({ error: `Код уже отправлен. Пожалуйста, подождите ${waitSec} сек.` });
    }

    // 3. Безопасная генерация 6-значного кода (CSPRNG)
    const code = (crypto.randomInt(0, 900000) + 100000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Срок: 10 минут

    // 4. Сохраняем в БД (удаляем старые коды для этого email)
    await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
    await prisma.verificationCode.create({
      data: {
        email: cleanEmail,
        code,
        expiresAt,
      },
    });

    // 5. Формируем HTML-письмо
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Подтверждение регистрации</h2>
        <p style="color: #475569; font-size: 14px; margin-bottom: 24px;">Используйте код ниже для подтверждения почты. Код действителен 10 минут.</p>
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a;">${code}</span>
        </div>
        <p style="color: #94a3b8; font-size: 11px;">Если вы не регистрировались на сайте, просто проигнорируйте это письмо.</p>
      </div>
    `;

    console.log(`🔑 [DEV REGISTRATION OTP] Email: ${cleanEmail} | Code: ${code}`);

    await sendEmail({
      to: cleanEmail,
      subject: 'Код подтверждения регистрации',
      html,
    });

    // Запоминаем кулдаун
    memoryCooldowns.set(cleanEmail, now);

    res.json({ message: 'Код подтверждения успешно отправлен на вашу почту.' });
  } catch (error) {
    console.error('sendRegisterCode error:', error);
    res.status(500).json({ error: 'Ошибка при отправке кода подтверждения.' });
  }
};

/**
 * ШАГ 2: Проверка кода и создание пользователя
 */
export const register = async (req, res) => {
  const { email, password, name, phone, code } = req.body;

  if (!email || !password || !name || !code) {
    return res.status(400).json({ error: 'Все поля, включая код подтверждения, обязательны' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.toString().trim();

  try {
    // 1. Защита от брутфорса (максимум 5 неверных попыток ввода)
    const attempts = memoryAttempts.get(cleanEmail) || 0;
    if (attempts >= 5) {
      await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
      memoryAttempts.delete(cleanEmail);
      return res.status(429).json({ error: 'Слишком много неверных попыток. Код аннулирован. Запросите новый.' });
    }

    // 2. Поиск кода в БД
    const tokenRecord = await prisma.verificationCode.findFirst({
      where: { email: cleanEmail, code: cleanCode },
    });

    if (!tokenRecord) {
      memoryAttempts.set(cleanEmail, attempts + 1);
      return res.status(400).json({ error: 'Неверный код подтверждения' });
    }

    // 3. Проверка срока действия
    if (new Date() > tokenRecord.expiresAt) {
      return res.status(400).json({ error: 'Срок действия кода истек. Запросите новый.' });
    }

    // 4. Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Создание пользователя в транзакции
    const newUser = await prisma.$transaction(async (tx) => {
      const exists = await tx.user.findUnique({ where: { email: cleanEmail } });
      if (exists) {
        throw new Error('EMAIL_EXISTS');
      }

      return tx.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          name: name.trim(),
          phone: phone ? phone.trim() : null,
        },
      });
    });

    // 6. Очищаем использованный код и попытки
    await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
    memoryAttempts.delete(cleanEmail);
    memoryCooldowns.delete(cleanEmail);

    // 7. Выпуск JWT токена
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Регистрация успешно завершена',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован' });
    }
    console.error('register error:', error);
    res.status(500).json({ error: 'Ошибка регистрации.' });
  }
};
```

---

## 7. Бэкенд: Маршруты (`authRoutes.js`)

Создайте файл `src/routes/authRoutes.js`:

```javascript
import express from 'express';
import { sendRegisterCode, register } from '../controllers/authController.js';

const router = express.Router();

router.post('/send-register-code', sendRegisterCode);
router.post('/register', register);

export default router;
```

Подключение в основном файле `server.js` / `app.js`:
```javascript
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
```

---

## 8. Фронтенд: API клиент (`api.js`)

Создайте `src/services/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const sendRegisterCode = async (userData) => {
  const response = await api.post('/auth/send-register-code', userData);
  return response.data;
};

export const registerWithCode = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};
```

---

## 9. Фронтенд: React Hook (`useEmailAuth.js`)

Создайте `src/hooks/useEmailAuth.js`:

```javascript
import { useState, useEffect } from 'react';
import { sendRegisterCode, registerWithCode } from '../services/api';

export function useEmailAuth({ onSuccess }) {
  const [step, setStep] = useState(1); // 1 = ввод данных, 2 = ввод OTP кода
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    code: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Обратный отсчет таймера (60 сек)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Шаг 1: Запрос кода
  const handleRequestCode = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await sendRegisterCode({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
      });
      setResendCooldown(60);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось отправить код');
    } finally {
      setLoading(false);
    }
  };

  // Шаг 2: Проверка кода и регистрация
  const handleConfirmCode = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await registerWithCode(formData);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный код подтверждения');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    await handleRequestCode();
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setError(null);
    handleChange('code', '');
  };

  return {
    step,
    formData,
    loading,
    error,
    resendCooldown,
    handleChange,
    handleRequestCode,
    handleConfirmCode,
    handleResend,
    handleBackToStep1,
  };
}
```

---

## 10. Фронтенд: UI Компонент формы (`RegisterModal.jsx`)

Создайте `src/components/RegisterModal.jsx`:

```jsx
import React from 'react';
import { useEmailAuth } from '../hooks/useEmailAuth';

export default function RegisterModal({ isOpen, onClose, onAuthSuccess }) {
  const {
    step,
    formData,
    loading,
    error,
    resendCooldown,
    handleChange,
    handleRequestCode,
    handleConfirmCode,
    handleResend,
    handleBackToStep1,
  } = useEmailAuth({
    onSuccess: (data) => {
      // Сохраняем токен
      localStorage.setItem('token', data.token);
      if (onAuthSuccess) onAuthSuccess(data.user);
      if (onClose) onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {step === 1 ? 'Регистрация аккаунта' : 'Подтверждение почты'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {step === 1
            ? 'Введите ваши данные для создания профиля'
            : `Мы отправили 6-значный код на ${formData.email}`}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* ШАГ 1: Ввод персональных данных */}
        {step === 1 && (
          <form onSubmit={handleRequestCode} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Имя *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Иван Иванов"
                className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="example@mail.com"
                className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Телефон (опционально)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Пароль *</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition"
            >
              {loading ? 'Отправка кода...' : 'Получить код на почту'}
            </button>
          </form>
        )}

        {/* ШАГ 2: Ввод кода подтверждения */}
        {step === 2 && (
          <form onSubmit={handleConfirmCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                6-значный код из письма
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full p-3 text-center tracking-[8px] font-mono text-2xl border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleBackToStep1}
                className="text-gray-500 hover:underline"
              >
                ← Изменить email
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className={resendCooldown > 0 ? 'text-gray-400' : 'text-blue-600 hover:underline'}
              >
                {resendCooldown > 0
                  ? `Повтор через ${resendCooldown}с`
                  : 'Отправить код повторно'}
              </button>
            </div>

            <button
              type="submit"
              disabled={formData.code.length !== 6 || loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition"
            >
              {loading ? 'Проверка...' : 'Завершить регистрацию'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

---

## 11. Чеклист перед запуском

1. **Создан `SMTP_PASS`?**  
   Проверьте, что в `.env` указан не обычный пароль от почты, а специальный пароль приложения.
2. **База данных создана?**  
   Выполнен `npx prisma migrate dev`.
3. **Безопасность соблюдена?**  
   - Код генерируется через `crypto.randomInt` (криптографически стойкий генератор случайных чисел).
   - Пароль хешируется через `bcrypt.hash(password, 10)`.
   - Есть лимит на 5 попыток ввода кода от брутфорса.
   - Есть кулдаун 60 секунд между отправками.
4. **В режиме разработки без SMTP:**  
   Если в `.env` не указывать `SMTP_USER` и `SMTP_PASS`, код будет автоматически выводиться в консоль бэкенда (`console.log('🔑 [DEV REGISTRATION OTP]...')`), что позволяет разрабатывать локально даже без подключения к почтовику.
