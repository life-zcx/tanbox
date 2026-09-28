import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const getLabelTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await prisma.labelTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return res.json(templates);
  } catch (error: any) {
    console.error('Error fetching label templates:', error);
    return res.status(500).json({ message: 'Ошибка при получении шаблонов этикеток' });
  }
};

export const getLabelTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await prisma.labelTemplate.findUnique({ where: { id } });
    if (!template) {
      return res.status(404).json({ message: 'Шаблон не найден' });
    }
    return res.json(template);
  } catch (error: any) {
    console.error('Error fetching label template:', error);
    return res.status(500).json({ message: 'Ошибка при получении шаблона' });
  }
};

export const createLabelTemplate = async (req: Request, res: Response) => {
  try {
    const { name, widthMm, heightMm, description, elements } = req.body;
    if (!name || !widthMm || !heightMm) {
      return res.status(400).json({ message: 'Укажите название, ширину и высоту этикетки' });
    }

    const template = await prisma.labelTemplate.create({
      data: {
        name,
        widthMm: Number(widthMm),
        heightMm: Number(heightMm),
        description: description || null,
        elements: elements || [],
      },
    });

    return res.status(201).json(template);
  } catch (error: any) {
    console.error('Error creating label template:', error);
    return res.status(500).json({ message: 'Ошибка при сохранении шаблона в БД' });
  }
};

export const updateLabelTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, widthMm, heightMm, description, elements } = req.body;

    const existing = await prisma.labelTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Шаблон не найден' });
    }

    const updated = await prisma.labelTemplate.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        widthMm: widthMm !== undefined ? Number(widthMm) : existing.widthMm,
        heightMm: heightMm !== undefined ? Number(heightMm) : existing.heightMm,
        description: description !== undefined ? description : existing.description,
        elements: elements !== undefined ? elements : existing.elements,
      },
    });

    return res.json(updated);
  } catch (error: any) {
    console.error('Error updating label template:', error);
    return res.status(500).json({ message: 'Ошибка при обновлении шаблона' });
  }
};

export const deleteLabelTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.labelTemplate.delete({ where: { id } });
    return res.json({ message: 'Шаблон успешно удален' });
  } catch (error: any) {
    console.error('Error deleting label template:', error);
    return res.status(500).json({ message: 'Ошибка при удалении шаблона' });
  }
};
