import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { OrderCategory } from '@prisma/client';

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
        sourceOrderId: sourceOrderId || null,
      },
    });

    // Link the created template to the order
    if (sourceOrderId) {
      await prisma.order.updateMany({
        where: { id: String(sourceOrderId) },
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
