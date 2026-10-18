import { prisma } from '../config/db';
import { OrderCategory, MarkirovkaCardStatus } from '@prisma/client';
import { CATEGORY_SCHEMAS } from '../config/categorySchemas';
import { getNktSettings } from './nktSettings.service';
import { logger } from '../utils/logger';

export interface CreateCardInput {
  accountId?: string;
  category: OrderCategory;
  name: string;
  brand?: string;
  article?: string;
  tnved?: string;
  country?: string;
  producerName?: string;
  targetGender?: string;
  size?: string;
  color?: string;
  composition?: string;
  packageType?: string;
  attributes?: Record<string, any>;
  photos?: string[];
  documents?: string[];
}

export class MarkirovkaCardsService {
  /**
   * Validates category-specific mandatory attributes
   */
  public validateCardAttributes(category: OrderCategory, attributes: Record<string, any> = {}): { valid: boolean; missing: string[] } {
    const schema = CATEGORY_SCHEMAS[category];
    if (!schema) return { valid: true, missing: [] };

    const missing: string[] = [];
    for (const field of schema.fields) {
      if (field.required) {
        const val = attributes[field.id];
        if (val === undefined || val === null || String(val).trim() === '') {
          missing.push(field.name);
        }
      }
    }
    return { valid: missing.length === 0, missing };
  }

  /**
   * Creates a new draft product card
   */
  public async createCard(userId: string, data: CreateCardInput) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Наименование товара обязательно');
    }
    if (!data.category || !CATEGORY_SCHEMAS[data.category]) {
      throw new Error('Некорректная товарная группа');
    }

    // Verify account ownership if accountId provided
    if (data.accountId) {
      const account = await prisma.markirovkaAccount.findFirst({
        where: { id: data.accountId, userId },
      });
      if (!account) {
        throw new Error('Указанный аккаунт маркировки не найден');
      }
    }

    const card = await prisma.markirovkaProductCard.create({
      data: {
        userId,
        accountId: data.accountId || null,
        category: data.category,
        name: data.name.trim(),
        brand: data.brand?.trim() || null,
        article: data.article?.trim() || null,
        tnved: data.tnved ? data.tnved.replace(/\D/g, '') : null,
        country: data.country?.trim() || 'Казахстан',
        producerName: data.producerName?.trim() || null,
        targetGender: data.targetGender?.trim() || null,
        size: data.size?.trim() || null,
        color: data.color?.trim() || null,
        composition: data.composition?.trim() || null,
        packageType: data.packageType || 'UNIT',
        attributes: data.attributes || {},
        photos: data.photos || [],
        documents: data.documents || [],
        status: MarkirovkaCardStatus.DRAFT,
      },
    });

    return card;
  }

  /**
   * Updates an existing product card
   */
  public async updateCard(cardId: string, userId: string, isAdmin: boolean, data: Partial<CreateCardInput>) {
    const existing = await prisma.markirovkaProductCard.findUnique({
      where: { id: cardId },
    });

    if (!existing) {
      throw new Error('Карточка товара не найдена');
    }
    if (!isAdmin && existing.userId !== userId) {
      throw new Error('Нет доступа к данной карточке товара');
    }
    if (!isAdmin && existing.status === MarkirovkaCardStatus.APPROVED) {
      throw new Error('Нельзя редактировать уже утвержденную карточку товара');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.brand !== undefined) updateData.brand = data.brand?.trim() || null;
    if (data.article !== undefined) updateData.article = data.article?.trim() || null;
    if (data.tnved !== undefined) updateData.tnved = data.tnved ? data.tnved.replace(/\D/g, '') : null;
    if (data.country !== undefined) updateData.country = data.country?.trim() || null;
    if (data.producerName !== undefined) updateData.producerName = data.producerName?.trim() || null;
    if (data.targetGender !== undefined) updateData.targetGender = data.targetGender?.trim() || null;
    if (data.size !== undefined) updateData.size = data.size?.trim() || null;
    if (data.color !== undefined) updateData.color = data.color?.trim() || null;
    if (data.composition !== undefined) updateData.composition = data.composition?.trim() || null;
    if (data.packageType !== undefined) updateData.packageType = data.packageType;
    if (data.attributes !== undefined) updateData.attributes = data.attributes;
    if (data.photos !== undefined) updateData.photos = data.photos;
    if (data.documents !== undefined) updateData.documents = data.documents;

    // If card was rejected, editing resets status to DRAFT
    if (existing.status === MarkirovkaCardStatus.REJECTED) {
      updateData.status = MarkirovkaCardStatus.DRAFT;
      updateData.moderationComment = null;
    }

    const updated = await prisma.markirovkaProductCard.update({
      where: { id: cardId },
      data: updateData,
    });

    return updated;
  }

  /**
   * Deletes a draft or rejected product card
   */
  public async deleteCard(cardId: string, userId: string, isAdmin: boolean) {
    const existing = await prisma.markirovkaProductCard.findUnique({
      where: { id: cardId },
    });

    if (!existing) {
      throw new Error('Карточка товара не найдена');
    }
    if (!isAdmin && existing.userId !== userId) {
      throw new Error('Нет доступа к данной карточке товара');
    }
    if (existing.status === MarkirovkaCardStatus.APPROVED) {
      throw new Error('Утвержденную карточку нельзя удалить');
    }

    await prisma.markirovkaProductCard.delete({
      where: { id: cardId },
    });

    return { success: true };
  }

  /**
   * Submits product card to Kazakhstan National Catalog (НКТ nationalcatalog.kz)
   */
  public async submitToNkt(cardId: string, userId: string, isAdmin: boolean) {
    const card = await prisma.markirovkaProductCard.findUnique({
      where: { id: cardId },
      include: { user: true, account: true },
    });

    if (!card) {
      throw new Error('Карточка товара не найдена');
    }
    if (!isAdmin && card.userId !== userId) {
      throw new Error('Нет доступа к данной карточке товара');
    }

    // Validate completeness
    if (!card.tnved || card.tnved.length < 4) {
      throw new Error('Укажите корректный код ТН ВЭД (минимум 4 цифры)');
    }

    const customAttrs = (card.attributes as any) || {};
    const validation = this.validateCardAttributes(card.category, customAttrs);
    if (!validation.valid) {
      throw new Error(`Заполните обязательные атрибуты: ${validation.missing.join(', ')}`);
    }

    const settings = getNktSettings();
    if (!settings.enabled || !settings.apiKey) {
      throw new Error('Интеграция с Национальным Каталогом (НКТ) временно не настроена в системе (отсутствует API-KEY). Обратитесь к администратору.');
    }

    // Build payload according to NKT Open API format
    const nktPayload: any = {
      productName: card.name,
      tradeMark: card.brand || '',
      vendorCode: card.article || '',
      tnvedCode: card.tnved,
      countryOfOrigin: card.country || 'Казахстан',
      producerName: card.producerName || card.user.companyName,
      packageType: card.packageType,
      categoryCode: CATEGORY_SCHEMAS[card.category]?.code || 'other',
      attributes: Object.entries(customAttrs).map(([code, value]) => ({
        code,
        value: String(value),
      })),
    };

    if (card.size) nktPayload.size = card.size;
    if (card.color) nktPayload.color = card.color;

    try {
      const url = `${settings.baseUrl}/portal/api/v1/products/requests`;
      logger.info(`[NKT Request] Submitting product card ${card.id} to ${url}`);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-KEY': settings.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(nktPayload),
        signal: AbortSignal.timeout(15000),
      });

      const responseData: any = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = responseData?.message || responseData?.error || `Ошибка сервера НКТ (HTTP ${res.status})`;
        throw new Error(errorMsg);
      }

      const nktRequestId = String(responseData?.id || responseData?.requestId || responseData?.data?.id || Date.now());

      // If NKT immediately assigned GTIN (auto-approval)
      const assignedGtin = responseData?.gtin || responseData?.ntin || null;

      const updated = await prisma.markirovkaProductCard.update({
        where: { id: card.id },
        data: {
          status: assignedGtin ? MarkirovkaCardStatus.APPROVED : MarkirovkaCardStatus.PENDING_MODERATION,
          nktRequestId,
          gtin: assignedGtin || card.gtin,
          moderationComment: null,
        },
      });

      return {
        success: true,
        requestId: nktRequestId,
        status: updated.status,
        gtin: updated.gtin,
      };
    } catch (err: any) {
      logger.error(`[NKT Request] Failed to submit card ${card.id}:`, err);
      throw new Error(`Ошибка отправки в Национальный каталог: ${err.message}`);
    }
  }

  /**
   * Checks status of product request in NKT
   */
  public async checkNktStatus(cardId: string) {
    const card = await prisma.markirovkaProductCard.findUnique({
      where: { id: cardId },
    });

    if (!card || !card.nktRequestId) {
      return card;
    }

    const settings = getNktSettings();
    if (!settings.enabled || !settings.apiKey) {
      return card;
    }

    try {
      const url = `${settings.baseUrl}/portal/api/v1/products/requests/${encodeURIComponent(card.nktRequestId)}`;
      const res = await fetch(url, {
        headers: {
          'X-API-KEY': settings.apiKey,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data: any = await res.json().catch(() => null);
        if (data) {
          const statusRaw = String(data.status || '').toUpperCase();
          const gtin = data.gtin || data.ntin || null;
          const rejectionReason = data.rejectionReason || data.comment || null;

          let newStatus = card.status;
          if (statusRaw.includes('APPROV') || statusRaw.includes('PUBLISH') || Boolean(gtin)) {
            newStatus = MarkirovkaCardStatus.APPROVED;
          } else if (statusRaw.includes('REJECT') || statusRaw.includes('DECLIN')) {
            newStatus = MarkirovkaCardStatus.REJECTED;
          }

          if (newStatus !== card.status || gtin !== card.gtin || rejectionReason !== card.moderationComment) {
            return await prisma.markirovkaProductCard.update({
              where: { id: card.id },
              data: {
                status: newStatus,
                gtin: gtin || card.gtin,
                moderationComment: rejectionReason,
              },
            });
          }
        }
      }
    } catch (e: any) {
      logger.warn(`[NKT Status Check] Failed for card ${cardId}: ${e.message}`);
    }

    return card;
  }

  /**
   * Fetches paginated list of product cards with filters
   */
  public async getCards(userId: string, isAdmin: boolean, query: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
    targetUserId?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (!isAdmin) {
      where.userId = userId;
    } else if (query.targetUserId) {
      where.userId = query.targetUserId;
    }

    if (query.status && Object.values(MarkirovkaCardStatus).includes(query.status as any)) {
      where.status = query.status;
    }

    if (query.category && Object.values(OrderCategory).includes(query.category as any)) {
      where.category = query.category;
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { article: { contains: q, mode: 'insensitive' } },
        { gtin: { contains: q } },
        { tnved: { contains: q } },
      ];
    }

    const [total, cards, statusCounts] = await Promise.all([
      prisma.markirovkaProductCard.count({ where }),
      prisma.markirovkaProductCard.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, companyName: true, binIin: true, email: true },
          },
          account: {
            select: { id: true, name: true, login: true },
          },
        },
      }),
      prisma.markirovkaProductCard.groupBy({
        by: ['status'],
        where: !isAdmin ? { userId } : (query.targetUserId ? { userId: query.targetUserId } : {}),
        _count: { status: true },
      }),
    ]);

    const counts: Record<string, number> = {
      ALL: 0,
      DRAFT: 0,
      PENDING_MODERATION: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    for (const sc of statusCounts) {
      counts[sc.status] = sc._count.status;
      counts.ALL += sc._count.status;
    }

    return {
      cards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts,
    };
  }
}

export const markirovkaCardsService = new MarkirovkaCardsService();
