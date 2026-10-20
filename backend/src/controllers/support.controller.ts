import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/db';
import { logger } from '../utils/logger';
import { telegram } from '../services/telegram.service';
import { sendEmail } from '../services/email.service';

const CATEGORY_NAMES: Record<string, string> = {
  ORDERS: 'Заказы и коды маркировки',
  PAYMENTS: 'Оплата и баланс',
  MARKAROVKA: 'Интеграция ИС МПТ (СУЗ)',
  PDF_PRINT: 'Печать и PDF-макеты',
  INTERFACE: 'Интерфейс и верстка',
  OTHER: 'Другое',
};

function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const submitBugReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const {
      category = 'OTHER',
      description,
      pageUrl,
      screenResolution,
    } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Пожалуйста, опишите обнаруженную ошибку' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        companyName: true,
        phone: true,
        email: true,
        binIin: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const categoryTitle = CATEGORY_NAMES[category] || category;
    const cleanDescription = String(description).trim().slice(0, 3000);
    const cleanPageUrl = pageUrl ? String(pageUrl).slice(0, 500) : undefined;
    const cleanResolution = screenResolution ? String(screenResolution).slice(0, 50) : undefined;
    const userAgent = req.headers['user-agent'] ? String(req.headers['user-agent']).slice(0, 300) : undefined;

    let screenshotFileName: string | undefined;
    let screenshotPath: string | undefined;

    if (req.file) {
      screenshotFileName = req.file.originalname;
      screenshotPath = `/uploads/bug-reports/${req.file.filename}`;
    }

    // Save as ServiceLead record for admin review
    const lead = await prisma.serviceLead.create({
      data: {
        serviceTitle: `[БАГ-РЕПОРТ] ${categoryTitle}`,
        companyName: user.companyName,
        phone: user.phone,
        email: user.email,
        binIin: user.binIin,
        notes: JSON.stringify(
          {
            type: 'BUG_REPORT',
            category,
            categoryTitle,
            description: cleanDescription,
            pageUrl: cleanPageUrl,
            screenResolution: cleanResolution,
            userAgent,
            screenshotFileName,
            screenshotPath,
          },
          null,
          2
        ),
        status: 'NEW',
      },
    });

    // Notify Telegram Admin / DevOps chat
    telegram
      .sendBugReportNotification({
        category: categoryTitle,
        description: cleanDescription,
        pageUrl: cleanPageUrl,
        companyName: user.companyName,
        phone: user.phone,
        email: user.email,
        binIin: user.binIin,
        userAgent,
        screenResolution: cleanResolution,
        hasScreenshot: Boolean(req.file),
        screenshotFileName,
      })
      .catch((err) => logger.warn(`Failed to dispatch bug report to telegram: ${err.message}`));

    // Escape all user inputs before embedding into email HTML to prevent HTML injection
    const safeCategory = escapeHtml(categoryTitle);
    const safeCompany = escapeHtml(user.companyName);
    const safePhone = escapeHtml(user.phone);
    const safeEmail = escapeHtml(user.email);
    const safeBin = escapeHtml(user.binIin);
    const safePageUrl = escapeHtml(cleanPageUrl);
    const safeResolution = escapeHtml(cleanResolution);
    const safeDescription = escapeHtml(cleanDescription);
    const safeFilename = escapeHtml(screenshotFileName);

    // Also dispatch email notification to support@tanbox.kz
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; color: #1e293b;">
        <h2 style="color: #e11d48; margin-top: 0;">🐞 Новый отчет об ошибке с платформы TANBOX.KZ</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 140px;"><b>Категория:</b></td><td><b>${safeCategory}</b></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><b>Клиент:</b></td><td>${safeCompany}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><b>Телефон:</b></td><td>${safePhone}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><b>Email:</b></td><td>${safeEmail}</td></tr>
          ${safeBin ? `<tr><td style="padding: 6px 0; color: #64748b;"><b>БИН/ИИН:</b></td><td>${safeBin}</td></tr>` : ''}
          ${safePageUrl ? `<tr><td style="padding: 6px 0; color: #64748b;"><b>Страница:</b></td><td>${safePageUrl}</td></tr>` : ''}
          ${safeResolution ? `<tr><td style="padding: 6px 0; color: #64748b;"><b>Разрешение:</b></td><td>${safeResolution}</td></tr>` : ''}
        </table>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h4 style="margin-top: 0; color: #0f172a; margin-bottom: 8px;">Описание ошибки от пользователя:</h4>
          <p style="white-space: pre-wrap; margin: 0; color: #334155; line-height: 1.5;">${safeDescription}</p>
        </div>
        ${safeFilename ? `<p style="font-size: 13px; color: #64748b;">📎 <i>Прикреплен файл: ${safeFilename}</i></p>` : ''}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Отправлено автоматически платформой TANBOX.KZ</p>
      </div>
    `;

    sendEmail({
      to: 'support@tanbox.kz',
      subject: `[БАГ-РЕПОРТ] ${safeCategory} — ${safeCompany}`,
      html: emailHtml,
      attachments: req.file ? [{ filename: req.file.originalname, path: req.file.path }] : undefined,
    }).catch((err) => logger.warn(`Failed to dispatch bug report email: ${err.message}`));

    logger.info(`[BugReport] New report from ${user.companyName} (${user.email}): category=${category}`);

    return res.status(201).json({
      success: true,
      message: 'Отчет об ошибке успешно отправлен. Спасибо за обратную связь!',
      leadId: lead.id,
    });
  } catch (error: any) {
    logger.error('Error submitting bug report:', error);
    return res.status(500).json({
      message: 'Ошибка при сохранении отчета об ошибке: ' + error.message,
    });
  }
};
