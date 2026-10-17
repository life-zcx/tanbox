import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { OrderCategory, OrderStatus, OnlinePaymentType, OnlinePaymentStatus } from '@prisma/client';
import { telegram } from '../services/telegram.service';

function isSafeUrl(url?: string | null): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const getUserTemplates = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

    let targetUserId = req.user.id;
    if (req.user.role === 'ADMIN' && req.query.userId && typeof req.query.userId === 'string') {
      targetUserId = req.query.userId;
    }

    const templates = await prisma.userStickerTemplate.findMany({
      where: { userId: targetUserId },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({ templates });
  } catch (error: any) {
    console.error('getUserTemplates error:', error);
    return res.status(500).json({ message: 'Ошибка при получении шаблонов пользователя' });
  }
};

export const getUserTemplateById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const { id } = req.params;

    const template = await prisma.userStickerTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ message: 'Шаблон не найден' });
    }

    if (req.user.role !== 'ADMIN' && template.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к этому шаблону' });
    }

    return res.json({ template });
  } catch (error: any) {
    console.error('getUserTemplateById error:', error);
    return res.status(500).json({ message: 'Ошибка при получении шаблона' });
  }
};

export const createUserTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

    const {
      name,
      category,
      widthMm,
      heightMm,
      elements,
      previewUrl,
      sourceOrderId,
      targetUserId,
    } = req.body;

    const assignedUserId =
      req.user.role === 'ADMIN' && targetUserId ? targetUserId : req.user.id;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Название шаблона обязательно' });
    }

    if (previewUrl && !isSafeUrl(previewUrl)) {
      return res.status(400).json({ message: 'Недопустимый формат URL предпросмотра' });
    }

    // 1. Prevent duplicate template creation for the same source order
    if (sourceOrderId) {
      const existingByOrder = await prisma.userStickerTemplate.findFirst({
        where: {
          userId: assignedUserId,
          sourceOrderId: String(sourceOrderId),
        },
      });
      if (existingByOrder) {
        return res.status(409).json({
          message: `Шаблон для этого заказа уже сохранён в библиотеке клиента («${existingByOrder.name}»)`,
          template: existingByOrder,
          alreadyExists: true,
        });
      }
    }

    // 2. Prevent duplicate templates with identical names for the same client
    const cleanName = name.trim().slice(0, 150);
    const existingByName = await prisma.userStickerTemplate.findFirst({
      where: {
        userId: assignedUserId,
        name: { equals: cleanName, mode: 'insensitive' },
      },
    });
    if (existingByName) {
      return res.status(409).json({
        message: `Шаблон с названием «${cleanName}» уже существует в библиотеке клиента`,
        template: existingByName,
        alreadyExists: true,
      });
    }

    const template = await prisma.userStickerTemplate.create({
      data: {
        userId: assignedUserId,
        name: cleanName,
        category: category && Object.values(OrderCategory).includes(category) ? category : null,
        widthMm: Number(widthMm) || 58,
        heightMm: Number(heightMm) || 40,
        elements: elements || [],
        previewUrl: previewUrl || null,
        isPaid: req.user.role === 'ADMIN',
        paidAt: req.user.role === 'ADMIN' ? new Date() : null,
        sourceOrderId: sourceOrderId || null,
      },
    });

    // Link the created template to the order (with user ownership check to prevent IDOR)
    if (sourceOrderId) {
      await prisma.order.updateMany({
        where: {
          id: String(sourceOrderId),
          ...(req.user.role === 'ADMIN' ? {} : { userId: assignedUserId }),
        },
        data: { templateId: template.id },
      });
    }

    return res.status(201).json({
      message: 'Шаблон успешно сохранён в библиотеку клиента',
      template,
    });
  } catch (error: any) {
    console.error('createUserTemplate error:', error);
    return res.status(500).json({ message: 'Ошибка при создании шаблона' });
  }
};

export const updateUserTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const { id } = req.params;
    const { name, category, widthMm, heightMm, elements, previewUrl } = req.body;

    if (previewUrl !== undefined && previewUrl !== null && !isSafeUrl(previewUrl)) {
      return res.status(400).json({ message: 'Недопустимый формат URL предпросмотра' });
    }

    const existing = await prisma.userStickerTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Шаблон не найден' });
    }

    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к этому шаблону' });
    }

    const updateData: any = {};
    if (name && typeof name === 'string') updateData.name = name.trim().slice(0, 150);
    if (category !== undefined) {
      updateData.category = category && Object.values(OrderCategory).includes(category) ? category : null;
    }
    if (widthMm !== undefined) updateData.widthMm = Number(widthMm) || 58;
    if (heightMm !== undefined) updateData.heightMm = Number(heightMm) || 40;
    if (elements !== undefined) updateData.elements = elements;
    if (previewUrl !== undefined) updateData.previewUrl = previewUrl;

    const updated = await prisma.userStickerTemplate.update({
      where: { id },
      data: updateData,
    });

    // Auto-sync active orders linked to this template
    if (elements !== undefined || widthMm !== undefined || heightMm !== undefined) {
      try {
        const newLayout = {
          widthMm: Number(widthMm) || existing.widthMm || 58,
          heightMm: Number(heightMm) || existing.heightMm || 40,
          elements: elements !== undefined ? elements : existing.elements,
          updatedAt: new Date().toISOString(),
        };

        const ordersToUpdate = await prisma.order.findMany({
          where: {
            templateId: id,
            status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
          },
          select: { id: true },
        });

        if (ordersToUpdate.length > 0) {
          await prisma.order.updateMany({
            where: {
              id: { in: ordersToUpdate.map((o) => o.id) },
            },
            data: {
              stickerLayout: newLayout,
            },
          });

          // Invalidate cached PDFs for these orders so new PDF generation uses updated layout
          for (const ord of ordersToUpdate) {
            const orderDir = path.resolve(process.cwd(), 'uploads', 'orders', ord.id);
            if (fs.existsSync(orderDir)) {
              try {
                const files = fs.readdirSync(orderDir);
                for (const f of files) {
                  if (f.endsWith('.pdf')) {
                    try { fs.unlinkSync(path.join(orderDir, f)); } catch {}
                  }
                }
              } catch (e) {
                console.warn('Could not clear cached PDFs on template update:', e);
              }
            }
          }
        }
      } catch (syncErr) {
        console.error('Error auto-syncing orders for updated template:', syncErr);
      }
    }

    return res.json({
      message: 'Шаблон успешно обновлен',
      template: updated,
    });
  } catch (error: any) {
    console.error('updateUserTemplate error:', error);
    return res.status(500).json({ message: 'Ошибка при обновлении шаблона' });
  }
};

export const deleteUserTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const { id } = req.params;

    const existing = await prisma.userStickerTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Шаблон не найден' });
    }

    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к этому шаблону' });
    }

    // Unlink orders referencing this template
    await prisma.order.updateMany({
      where: { templateId: id },
      data: { templateId: null },
    });

    await prisma.userStickerTemplate.delete({
      where: { id },
    });

    return res.json({ message: 'Шаблон успешно удален' });
  } catch (error: any) {
    console.error('deleteUserTemplate error:', error);
    return res.status(500).json({ message: 'Ошибка при удалении шаблона' });
  }
};

/**
 * Оплата и разблокировка самостоятельно созданного макета из конструктора (1 000 ₸ с баланса)
 * POST /api/user-templates/:id/pay
 */
export const payUserTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const { id } = req.params;

    const template = await prisma.userStickerTemplate.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!template) {
      return res.status(404).json({ message: 'Шаблон не найден' });
    }

    if (req.user.role !== 'ADMIN' && template.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к этому шаблону' });
    }

    if (template.isPaid) {
      return res.json({
        message: 'Шаблон уже оплачен и утвержден',
        template,
        alreadyPaid: true,
      });
    }

    // Получаем стоимость из pricingSettings (по умолчанию 1000 ₸)
    const pricingSettings = await prisma.pricingSettings.findUnique({
      where: { key: 'GLOBAL' },
    });
    const layoutPrice = Number(pricingSettings?.selfLayoutPrice) || 1000;

    // Проверяем баланс пользователя
    const user = await prisma.user.findUnique({
      where: { id: template.userId },
      select: { id: true, balance: true, companyName: true, email: true, phone: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const currentBalance = Number(user.balance);
    if (currentBalance < layoutPrice) {
      return res.status(400).json({
        error: 'INSUFFICIENT_BALANCE',
        message: `Недостаточно средств на балансе. Стоимость утверждения макета: ${layoutPrice.toLocaleString('ru-RU')} ₸. Ваш текущий баланс: ${currentBalance.toLocaleString('ru-RU')} ₸`,
        requiredAmount: layoutPrice,
        currentBalance,
        missingAmount: layoutPrice - currentBalance,
      });
    }

    // Атомарное списание с баланса, разблокировка макета и фиксация платежа
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const paymentNumber = `TB-TMP-${timestamp}-${randomSuffix}`;

    const [updatedUser, updatedTemplate, payment] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: layoutPrice },
        },
      }),
      prisma.userStickerTemplate.update({
        where: { id },
        data: {
          isPaid: true,
          paidAt: new Date(),
        },
      }),
      prisma.onlinePayment.create({
        data: {
          paymentNumber,
          userId: user.id,
          type: OnlinePaymentType.STICKER_LAYOUT,
          amount: layoutPrice,
          currency: 'KZT',
          status: OnlinePaymentStatus.PAID,
          description: `Оплата макета этикетки «${template.name}» (${template.widthMm}×${template.heightMm} мм)`,
          metadata: {
            templateId: template.id,
            templateName: template.name,
            dimensions: `${template.widthMm}x${template.heightMm} мм`,
            paidViaBalance: true,
          },
        },
      }),
    ]);

    // Уведомление в Telegram
    telegram.sendOnlinePaymentNotification({
      paymentNumber,
      amount: layoutPrice.toString(),
      companyName: user.companyName,
      email: user.email,
      phone: user.phone,
      type: 'STICKER_LAYOUT',
      description: `Самостоятельное утверждение макета «${template.name}» (с баланса ЛК)`,
    }).catch(() => {});

    return res.json({
      message: `Макет «${template.name}» успешно оплачен и утвержден!`,
      template: updatedTemplate,
      newBalance: Number(updatedUser.balance),
    });
  } catch (error: any) {
    console.error('payUserTemplate error:', error);
    return res.status(500).json({ message: 'Ошибка при оплате макета: ' + (error.message || 'Внутренняя ошибка') });
  }
};

/**
 * Заказ индивидуальной разработки макета дизайнером TANBOX (5 000 ₸ с баланса)
 * POST /api/user-templates/order-designer
 */
export const orderDesignerLayout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

    const {
      name,
      category,
      widthMm = 58,
      heightMm = 40,
      description,
      sampleFileUrl,
    } = req.body;

    const pricingSettings = await prisma.pricingSettings.findUnique({
      where: { key: 'GLOBAL' },
    });
    const designerPrice = Number(pricingSettings?.stickerLayoutPrice) || 5000;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, balance: true, companyName: true, email: true, phone: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const currentBalance = Number(user.balance);
    if (currentBalance < designerPrice) {
      return res.status(400).json({
        error: 'INSUFFICIENT_BALANCE',
        message: `Недостаточно средств на балансе для заказа дизайна. Стоимость: ${designerPrice.toLocaleString('ru-RU')} ₸, ваш баланс: ${currentBalance.toLocaleString('ru-RU')} ₸`,
        requiredAmount: designerPrice,
        currentBalance,
        missingAmount: designerPrice - currentBalance,
      });
    }

    const cleanName = (name && typeof name === 'string' ? name.trim() : `Макет от дизайнера (${widthMm}×${heightMm} мм)`).slice(0, 150);
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const paymentNumber = `TB-DSN-${timestamp}-${randomSuffix}`;

    const [updatedUser, newTemplate, payment] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: { decrement: designerPrice } },
      }),
      prisma.userStickerTemplate.create({
        data: {
          userId: user.id,
          name: cleanName,
          category: category && Object.values(OrderCategory).includes(category) ? category : null,
          widthMm: Number(widthMm) || 58,
          heightMm: Number(heightMm) || 40,
          elements: [],
          isPaid: true,
          paidAt: new Date(),
        },
      }),
      prisma.onlinePayment.create({
        data: {
          paymentNumber,
          userId: user.id,
          type: OnlinePaymentType.STICKER_LAYOUT,
          amount: designerPrice,
          currency: 'KZT',
          status: OnlinePaymentStatus.PAID,
          description: `Заказ профессионального дизайна макета TANBOX: «${cleanName}»`,
          metadata: {
            service: 'DESIGNER_LAYOUT',
            userNotes: description || '',
            sampleFileUrl: sampleFileUrl || '',
          },
        },
      }),
    ]);

    // Уведомление в Telegram отделу дизайна
    telegram.sendOnlinePaymentNotification({
      paymentNumber,
      amount: designerPrice.toString(),
      companyName: user.companyName,
      email: user.email,
      phone: user.phone,
      type: 'STICKER_LAYOUT',
      description: `🎨 ЗАКАЗ ДИЗАЙНА МАКЕТА (${designerPrice.toLocaleString('ru-RU')} ₸)\nРазмер: ${widthMm}×${heightMm} мм\nКлиент: ${user.companyName}\nПожелания: ${description || '—'}`,
    }).catch(() => {});

    return res.status(201).json({
      message: 'Заказ на дизайн макета успешно оформлен! Дизайнер TANBOX подготовит макет и согласует его с вами.',
      template: newTemplate,
      newBalance: Number(updatedUser.balance),
    });
  } catch (error: any) {
    console.error('orderDesignerLayout error:', error);
    return res.status(500).json({ message: 'Ошибка при заказе макета: ' + (error.message || 'Внутренняя ошибка') });
  }
};
