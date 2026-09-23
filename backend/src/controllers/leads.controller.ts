import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const createLead = async (req: Request, res: Response) => {
  try {
    const { serviceTitle, companyName, phone, email, binIin, notes } = req.body;

    if (!serviceTitle || !companyName || !phone) {
      return res.status(400).json({
        message: 'Обязательные поля: услуга, название компании и телефон',
      });
    }

    const lead = await prisma.serviceLead.create({
      data: {
        serviceTitle,
        companyName,
        phone,
        email: email || null,
        binIin: binIin || null,
        notes: notes || null,
        status: 'NEW',
      },
    });

    return res.status(201).json({
      message: 'Заявка успешно создана',
      lead,
    });
  } catch (error: any) {
    console.error('Error creating service lead:', error);
    return res.status(500).json({
      message: 'Ошибка сервера при создании заявки на услугу',
      error: error.message,
    });
  }
};

export const getLeads = async (req: Request, res: Response) => {
  try {
    const leads = await prisma.serviceLead.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.json(leads);
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({
      message: 'Ошибка при получении списка заявок',
      error: error.message,
    });
  }
};

export const updateLeadStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        message: 'Некорректный статус заявки',
      });
    }

    const updated = await prisma.serviceLead.update({
      where: { id },
      data: { status },
    });

    return res.json({
      message: 'Статус заявки успешно обновлен',
      lead: updated,
    });
  } catch (error: any) {
    console.error('Error updating lead status:', error);
    return res.status(500).json({
      message: 'Ошибка обновления статуса заявки',
      error: error.message,
    });
  }
};
