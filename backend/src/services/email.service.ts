import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const ALLOW_SELF_SIGNED = process.env.ALLOW_SELF_SIGNED_SMTP !== 'false';

const SMTP_SECURE = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : (SMTP_PORT === 465 || SMTP_PORT === 2465);

const getTransporter = () => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: !ALLOW_SELF_SIGNED,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    cid?: string;
  }>;
}

export const sendEmail = async ({ to, subject, html, attachments }: SendEmailOptions): Promise<{ id?: string; mock?: boolean }> => {
  const from = `"TANBOX" <${SMTP_USER || 'no-reply@tanbox.kz'}>`;
  const transporter = getTransporter();

  if (!transporter) {
    logger.warn(`[SMTP NOT CONFIGURED] Email to ${to} skipped (SMTP_HOST/USER/PASS not set).`);
    return { id: 'mock-not-configured-id', mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments,
    });

    logger.info(`Email sent successfully to ${to} (MessageId: ${info.messageId})`);
    return { id: info.messageId };
  } catch (error: any) {
    logger.error(`SMTP Send Error to ${to}: ${error?.message || error}`);
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`[DEV SMTP FALLBACK] Continuing in development mode.`);
      return { id: 'mock-dev-id', mock: true };
    }
    throw error;
  }
};

export const sendVerificationOtpEmail = async (to: string, code: string): Promise<void> => {
  const cleanEmail = to.trim().toLowerCase();
  
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[AUTH] Verification OTP email dispatched for ${cleanEmail}`);
  }

  // Official logo attachment
  const logoPath = path.resolve(__dirname, '../assets/tanbox-logo.png');
  const hasLogo = fs.existsSync(logoPath);
  const attachments = hasLogo
    ? [
        {
          filename: 'tanbox-logo.png',
          path: logoPath,
          cid: 'tanboxlogo',
        },
      ]
    : [];

  const logoHtml = hasLogo
    ? `<img src="cid:tanboxlogo" alt="TANBOX.KZ" width="140" height="24" style="display: block; border: 0; width: 140px; height: 24px; max-width: 140px; margin-bottom: 24px; -ms-interpolation-mode: bicubic;" />`
    : `<div style="font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.5px; margin-bottom: 24px;">TANBOX.KZ</div>`;

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Код подтверждения TANBOX</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f6f9;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px 28px;">
          <tr>
            <td>
              ${logoHtml}

              <h1 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #111827; line-height: 1.3;">
                Код подтверждения
              </h1>

              <p style="margin: 0 0 20px; font-size: 14px; color: #374151; line-height: 1.5;">
                Для завершения регистрации в сервисе TANBOX введите одноразовый код:
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 12px; text-align: center; margin-bottom: 20px;">
                <span style="font-family: Consolas, 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0082FB; display: inline-block; padding-left: 8px;">
                  ${code}
                </span>
              </div>

              <p style="margin: 0 0 24px; font-size: 12px; color: #6b7280; line-height: 1.5;">
                Код действителен 10 минут. Если вы не запрашивали регистрацию, проигнорируйте это сообщение.
              </p>

              <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 11px; color: #9ca3af; line-height: 1.4;">
                TANBOX.KZ · Система цифровой маркировки товаров
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await sendEmail({
    to: cleanEmail,
    subject: `${code} — код подтверждения TANBOX`,
    html,
    attachments,
  });
};

export const sendPasswordResetOtpEmail = async (to: string, code: string): Promise<void> => {
  const cleanEmail = to.trim().toLowerCase();

  if (process.env.NODE_ENV === 'development') {
    logger.info(`[AUTH] Password reset OTP email dispatched for ${cleanEmail}`);
  }

  const logoPath = path.resolve(__dirname, '../assets/tanbox-logo.png');
  const hasLogo = fs.existsSync(logoPath);
  const attachments = hasLogo
    ? [
        {
          filename: 'tanbox-logo.png',
          path: logoPath,
          cid: 'tanboxlogo',
        },
      ]
    : [];

  const logoHtml = hasLogo
    ? `<img src="cid:tanboxlogo" alt="TANBOX.KZ" width="140" height="24" style="display: block; border: 0; width: 140px; height: 24px; max-width: 140px; margin-bottom: 24px; -ms-interpolation-mode: bicubic;" />`
    : `<div style="font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.5px; margin-bottom: 24px;">TANBOX.KZ</div>`;

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Восстановление пароля TANBOX</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f6f9;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px 28px;">
          <tr>
            <td>
              ${logoHtml}

              <h1 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #111827; line-height: 1.3;">
                Сброс пароля
              </h1>

              <p style="margin: 0 0 20px; font-size: 14px; color: #374151; line-height: 1.5;">
                Вы запросили восстановление пароля в сервисе TANBOX. Введите код подтверждения:
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 12px; text-align: center; margin-bottom: 20px;">
                <span style="font-family: Consolas, 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0082FB; display: inline-block; padding-left: 8px;">
                  ${code}
                </span>
              </div>

              <p style="margin: 0 0 24px; font-size: 12px; color: #6b7280; line-height: 1.5;">
                Код действителен 10 минут. Если вы не запрашивали сброс пароля, проигнорируйте это письмо или смените пароль в настройках.
              </p>

              <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 11px; color: #9ca3af; line-height: 1.4;">
                TANBOX.KZ · Система цифровой маркировки товаров
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await sendEmail({
    to: cleanEmail,
    subject: `${code} — код для сброса пароля TANBOX`,
    html,
    attachments,
  });
};


