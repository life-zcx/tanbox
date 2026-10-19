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

export const publishCardToNktHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    const { id } = req.params;

    const result = await markirovkaCardsService.publishToNkt(id, req.user.id, req.user.role === 'ADMIN');
    return res.json({
      success: true,
      message: 'Карточка успешно опубликована в Национальном каталоге товаров',
      ...result,
    });
  } catch (err: any) {
    logger.error('publishCardToNktHandler error:', err);
    return res.status(400).json({ message: err.message || 'Ошибка публикации карточки в НКТ' });
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

const RU_KK_DICT: Record<string, string> = {
  кроссовки: 'кроссовкалар',
  кеды: 'кедылер',
  ботинки: 'бәтеңкелер',
  полуботинки: 'жартылай бәтеңкелер',
  туфли: 'туфлилер',
  сапоги: 'етіктер',
  полусапоги: 'жартылай етіктер',
  сандалии: 'сандалдар',
  босоножки: 'босоножкалар',
  мокасины: 'мокасиндер',
  тапочки: 'тәпішкелер',
  обувь: 'аяқ киім',
  мужской: 'ерлер',
  мужские: 'ерлерге арналған',
  мужская: 'ерлерге арналған',
  женский: 'әйелдер',
  женские: 'әйелдерге арналған',
  женская: 'әйелдерге арналған',
  детский: 'балалар',
  детские: 'балаларға арналған',
  детская: 'балаларға арналған',
  кожаный: 'былғары',
  кожаные: 'былғары',
  кожаная: 'былғары',
  замша: 'күдері',
  замшевые: 'күдері',
  текстиль: 'тоқыма',
  текстильные: 'тоқыма',
  резиновые: 'резеңке',
  зимний: 'қысқы',
  зимние: 'қысқы',
  летний: 'жазғы',
  летние: 'жазғы',
  демисезонный: 'маусымаралық',
  демисезонные: 'маусымаралық',
  масло: 'май',
  моторное: 'мотор',
  синтетическое: 'синтетикалық',
  полусинтетическое: 'жартылай синтетикалық',
  минеральное: 'минералды',
  трансмиссионное: 'трансмиссиялық',
  смазка: 'майлағыш',
  жидкость: 'сұйықтық',
  антифриз: 'антифриз',
  одежда: 'киім',
  куртка: 'күрте',
  пальто: 'пальто',
  пуховик: 'мамық күрте',
  ветровка: 'желқағар',
  брюки: 'шалбар',
  джинсы: 'джинсылар',
  шорты: 'шортылар',
  рубашка: 'жейде',
  футболка: 'футболка',
  толстовка: 'толстовка',
  джемпер: 'джемпер',
  носки: 'шұлықтар',
  вода: 'су',
  напиток: 'сусын',
  молоко: 'сүт',
  сыр: 'ірімшік',
  шина: 'шина',
  шины: 'шиналар',
  автошины: 'автошиналар',
};

export const translateToKazakhHandler = async (req: AuthRequest, res: Response) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) {
      return res.status(400).json({ message: 'Текст для перевода не указан' });
    }

    let translated = '';

    // 1. Try MyMemory API with native fetch
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ru|kk`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = (await response.json()) as any;
        const resText = data?.responseData?.translatedText;
        if (resText && !resText.includes('MYMEMORY WARNING') && !resText.includes('<html>')) {
          translated = resText;
        }
      }
    } catch (e: any) {
      logger.warn('Translation API error, using dictionary fallback:', e?.message);
    }

    // 2. Fallback: Dictionary replace word by word
    if (!translated) {
      const words = text.split(/\s+/);
      const translatedWords = words.map((w) => {
        const clean = w.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
        if (RU_KK_DICT[clean]) {
          return RU_KK_DICT[clean];
        }
        return w;
      });
      translated = translatedWords.join(' ');
    }

    return res.json({ success: true, text: translated || text });
  } catch (err: any) {
    logger.error('translateToKazakhHandler error:', err);
    return res.status(500).json({ message: 'Ошибка перевода текста' });
  }
};

