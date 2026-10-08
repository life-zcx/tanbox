import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { logger } from '../utils/logger';
import { telegram } from '../services/telegram.service';

export const createLead = async (req: Request, res: Response) => {
  try {
    const { serviceTitle, companyName, phone, email, binIin, notes, consent } = req.body;

    if (consent === false) {
      return res.status(400).json({
        message: 'Необходимо подтвердить согласие на сбор и обработку персональных данных (Закон РК № 94-V)',
      });
    }

    if (!serviceTitle || !companyName || !phone) {
      return res.status(400).json({
        message: 'Обязательные поля: услуга, название компании и телефон',
      });
    }

    // Input sanitization and length restriction
    const cleanServiceTitle = String(serviceTitle).slice(0, 100);
    const cleanCompanyName = String(companyName).slice(0, 150);
    const cleanPhone = String(phone).slice(0, 30);
    const cleanEmail = email ? String(email).slice(0, 100) : null;
    const cleanBinIin = binIin ? String(binIin).slice(0, 20) : null;
    const cleanNotes = notes ? String(notes).slice(0, 1000) : null;

    const lead = await prisma.serviceLead.create({
      data: {
        serviceTitle: cleanServiceTitle,
        companyName: cleanCompanyName,
        phone: cleanPhone,
        email: cleanEmail,
        binIin: cleanBinIin,
        notes: cleanNotes,
        status: 'NEW',
      },
    });

    // Asynchronously dispatch notification to Telegram Leads chat
    telegram.sendNewLeadNotification({
      id: lead.id,
      serviceTitle: lead.serviceTitle,
      companyName: lead.companyName,
      phone: lead.phone,
      email: lead.email,
      binIin: lead.binIin,
      notes: lead.notes,
    }).catch(() => {});

    return res.status(201).json({
      message: 'Заявка успешно создана',
      lead,
    });
  } catch (error: any) {
    logger.error('Error creating service lead:', error);
    return res.status(500).json({
      message: 'Ошибка сервера при создании заявки на услугу',
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
    logger.error('Error fetching leads:', error);
    return res.status(500).json({
      message: 'Ошибка при получении списка заявок',
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
    logger.error('Error updating lead status:', error);
    return res.status(500).json({
      message: 'Ошибка обновления статуса заявки',
    });
  }
};
