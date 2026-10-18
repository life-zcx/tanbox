import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { markirovkaCardsService } from '../services/markirovkaCards.service';
import { CATEGORY_SCHEMAS } from '../config/categorySchemas';
import { OrderCategory } from '@prisma/client';
import { logger } from '../utils/logger';

export const getCardsHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const isAdmin = req.user.role === 'ADMIN';

    const result = await markirovkaCardsService.getCards(req.user.id, isAdmin, req.query);
    return res.json(result);
  } catch (err: any) {
    logger.error('getCardsHandler error:', err);
    return res.status(500).json({ message: err.message || 'Ошибка получения карточек товаров' });
  }
};

export const getCardByIdHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const { id } = req.params;

    const card = await markirovkaCardsService.checkNktStatus(id);
    if (!card) {
      return res.status(404).json({ message: 'Карточка товара не найдена' });
    }

    if (req.user.role !== 'ADMIN' && card.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа к данной карточке товара' });
    }

    const schema = CATEGORY_SCHEMAS[card.category];
    return res.json({ card, schema });
  } catch (err: any) {
    logger.error('getCardByIdHandler error:', err);
    return res.status(500).json({ message: err.message || 'Ошибка получения карточки' });
  }
};

export const createCardHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const targetUserId = req.user.role === 'ADMIN' && req.body.targetUserId ? req.body.targetUserId : req.user.id;

    const card = await markirovkaCardsService.createCard(targetUserId, req.body);
    return res.status(201).json({
      success: true,
      message: 'Карточка товара успешно создана в черновиках',
      card,
    });
  } catch (err: any) {
    logger.error('createCardHandler error:', err);
    return res.status(400).json({ message: err.message || 'Ошибка создания карточки товара' });
  }
};

export const updateCardHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const { id } = req.params;
    const isAdmin = req.user.role === 'ADMIN';

    const card = await markirovkaCardsService.updateCard(id, req.user.id, isAdmin, req.body);
    return res.json({
      success: true,
      message: 'Карточка товара успешно сохранена',
      card,
    });
  } catch (err: any) {
    logger.error('updateCardHandler error:', err);
    return res.status(400).json({ message: err.message || 'Ошибка обновления карточки' });
  }
};

export const deleteCardHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const { id } = req.params;
    const isAdmin = req.user.role === 'ADMIN';

    await markirovkaCardsService.deleteCard(id, req.user.id, isAdmin);
    return res.json({
      success: true,
      message: 'Карточка товара успешно удалена',
    });
  } catch (err: any) {
    logger.error('deleteCardHandler error:', err);
    return res.status(400).json({ message: err.message || 'Ошибка удаления карточки' });
  }
};

export const submitCardToNktHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const { id } = req.params;
    const isAdmin = req.user.role === 'ADMIN';

    const result = await markirovkaCardsService.submitToNkt(id, req.user.id, isAdmin);
    return res.json({
      success: true,
      message: 'Карточка товара успешно отправлена на модерацию в Национальный каталог (НКТ)',
      result,
    });
  } catch (err: any) {
    logger.error('submitCardToNktHandler error:', err);
    return res.status(400).json({ message: err.message || 'Ошибка отправки в Национальный каталог' });
  }
};

export const checkCardStatusHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const { id } = req.params;

    const card = await markirovkaCardsService.checkNktStatus(id);
    return res.json({
      success: true,
      card,
    });
  } catch (err: any) {
    logger.error('checkCardStatusHandler error:', err);
    return res.status(400).json({ message: err.message || 'Ошибка проверки статуса' });
  }
};

export const getCategorySchemaHandler = async (req: AuthRequest, res: Response) => {
  try {
    const category = req.params.category as OrderCategory;
    const schema = CATEGORY_SCHEMAS[category];
    if (!schema) {
      return res.status(404).json({ message: 'Товарная группа не найдена' });
    }
    return res.json({ schema });
  } catch (err: any) {
    return res.status(500).json({ message: 'Ошибка получения схемы полей' });
  }
};

export const listCategoriesHandler = async (req: AuthRequest, res: Response) => {
  try {
    const categories = Object.values(CATEGORY_SCHEMAS).map((s) => ({
      category: s.category,
      nameRu: s.nameRu,
      nameKk: s.nameKk,
      code: s.code,
      tnvedExamples: s.tnvedExamples,
      fieldsCount: s.fields.length,
    }));
    return res.json({ categories });
  } catch (err: any) {
    return res.status(500).json({ message: 'Ошибка получения списка категорий' });
  }
};
