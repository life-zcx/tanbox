import { prisma } from '../config/db';
import { OrderCategory, MarkirovkaCardStatus } from '@prisma/client';
import { CATEGORY_SCHEMAS } from '../config/categorySchemas';
import { getNktSettings } from './nktSettings.service';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export interface CreateCardInput {
  accountId?: string;
  category: OrderCategory;
  name: string;
  nameKk?: string;
  brand?: string;
  article?: string;
  model?: string;
  tnved?: string;
  country?: string;
  producerName?: string;
  producerAddress?: string;
  importerName?: string;
  importerBin?: string;
  targetGender?: string;
  size?: string;
  color?: string;
  composition?: string;
  packageType?: string;
  gtin?: string;
  gostOrTu?: string;
  certificateType?: string;
  certificateNumber?: string;
  certificateDate?: string | Date;
  certificateExpiryDate?: string | Date;
  netWeight?: string;
  grossWeight?: string;
  shelfLife?: string;
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

    let targetAccountId = data.accountId || null;
    if (!targetAccountId) {
      const userAccount = await prisma.markirovkaAccount.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (userAccount) {
        targetAccountId = userAccount.id;
      }
    }

    const card = await prisma.markirovkaProductCard.create({
      data: {
        userId,
        accountId: targetAccountId,
        category: data.category,
        name: data.name.trim(),
        nameKk: data.nameKk?.trim() || null,
        brand: data.brand?.trim() || null,
        article: data.article?.trim() || null,
        model: data.model?.trim() || null,
        tnved: data.tnved ? data.tnved.replace(/\D/g, '') : null,
        country: data.country?.trim() || 'Казахстан',
        producerName: data.producerName?.trim() || null,
        producerAddress: data.producerAddress?.trim() || null,
        importerName: data.importerName?.trim() || null,
        importerBin: data.importerBin?.trim() || null,
        targetGender: data.targetGender?.trim() || null,
        size: data.size?.trim() || null,
        color: data.color?.trim() || null,
        composition: data.composition?.trim() || null,
        packageType: data.packageType || 'UNIT',
        gtin: data.gtin?.trim() || null,
        gostOrTu: data.gostOrTu?.trim() || null,
        certificateType: data.certificateType?.trim() || null,
        certificateNumber: data.certificateNumber?.trim() || null,
        certificateDate: data.certificateDate ? new Date(data.certificateDate) : null,
        certificateExpiryDate: data.certificateExpiryDate ? new Date(data.certificateExpiryDate) : null,
        netWeight: data.netWeight?.trim() || null,
        grossWeight: data.grossWeight?.trim() || null,
        shelfLife: data.shelfLife?.trim() || null,
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
    if (data.accountId !== undefined) updateData.accountId = data.accountId || null;
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.nameKk !== undefined) updateData.nameKk = data.nameKk?.trim() || null;
    if (data.brand !== undefined) updateData.brand = data.brand?.trim() || null;
    if (data.article !== undefined) updateData.article = data.article?.trim() || null;
    if (data.model !== undefined) updateData.model = data.model?.trim() || null;
    if (data.tnved !== undefined) updateData.tnved = data.tnved ? data.tnved.replace(/\D/g, '') : null;
    if (data.country !== undefined) updateData.country = data.country?.trim() || null;
    if (data.producerName !== undefined) updateData.producerName = data.producerName?.trim() || null;
    if (data.producerAddress !== undefined) updateData.producerAddress = data.producerAddress?.trim() || null;
    if (data.importerName !== undefined) updateData.importerName = data.importerName?.trim() || null;
    if (data.importerBin !== undefined) updateData.importerBin = data.importerBin?.trim() || null;
    if (data.targetGender !== undefined) updateData.targetGender = data.targetGender?.trim() || null;
    if (data.size !== undefined) updateData.size = data.size?.trim() || null;
    if (data.color !== undefined) updateData.color = data.color?.trim() || null;
    if (data.composition !== undefined) updateData.composition = data.composition?.trim() || null;
    if (data.packageType !== undefined) updateData.packageType = data.packageType;
    if (data.gtin !== undefined) updateData.gtin = data.gtin?.trim() || null;
    if (data.gostOrTu !== undefined) updateData.gostOrTu = data.gostOrTu?.trim() || null;
    if (data.certificateType !== undefined) updateData.certificateType = data.certificateType?.trim() || null;
    if (data.certificateNumber !== undefined) updateData.certificateNumber = data.certificateNumber?.trim() || null;
    if (data.certificateDate !== undefined) {
      updateData.certificateDate = data.certificateDate ? new Date(data.certificateDate) : null;
    }
    if (data.certificateExpiryDate !== undefined) {
      updateData.certificateExpiryDate = data.certificateExpiryDate ? new Date(data.certificateExpiryDate) : null;
    }
    if (data.netWeight !== undefined) updateData.netWeight = data.netWeight?.trim() || null;
    if (data.grossWeight !== undefined) updateData.grossWeight = data.grossWeight?.trim() || null;
    if (data.shelfLife !== undefined) updateData.shelfLife = data.shelfLife?.trim() || null;
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

    // If card was submitted to NKT and has a request ID, also delete request from NKT
    if (existing.nktRequestId) {
      try {
        let account = existing.accountId
          ? await prisma.markirovkaAccount.findUnique({ where: { id: existing.accountId } })
          : await prisma.markirovkaAccount.findFirst({ where: { userId: existing.userId } });

        const settings = getNktSettings();
        const cleanUserKey = account?.nktApiKey ? account.nktApiKey.replace(/[^\x20-\x7E]/g, '').trim() : '';
        const effectiveApiKey = cleanUserKey || settings.apiKey;
        const effectiveBaseUrl = (account?.nktBaseUrl && account.nktBaseUrl.trim()) || settings.baseUrl || 'https://nationalcatalog.kz/gwp';

        if (effectiveApiKey) {
          logger.info(`[NKT Delete] Removing request #${existing.nktRequestId} from NKT for card ${cardId}`);
          await fetch(`${effectiveBaseUrl}/portal/api/v1/products/requests/${encodeURIComponent(existing.nktRequestId)}`, {
            method: 'DELETE',
            headers: { 'X-API-KEY': effectiveApiKey, 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000),
          }).catch(() => null);
        }
      } catch (nktErr: any) {
        logger.warn(`[NKT Delete] Could not delete request #${existing.nktRequestId} from NKT: ${nktErr.message}`);
      }
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
    if (!card.gtin || !card.gtin.trim()) {
      throw new Error(
        'Для отправки карточки в Национальный каталог необходимо указать штрихкод GTIN (13 или 14 цифр). Заполните GTIN при редактировании карточки.'
      );
    }

    const customAttrs = (card.attributes as any) || {};
    const validation = this.validateCardAttributes(card.category, customAttrs);
    if (!validation.valid) {
      throw new Error(`Заполните обязательные атрибуты: ${validation.missing.join(', ')}`);
    }

    let account = card.account;
    if (!account) {
      account = await prisma.markirovkaAccount.findFirst({
        where: { userId: card.userId },
        orderBy: { createdAt: 'desc' },
      });
      if (account) {
        await prisma.markirovkaProductCard.update({
          where: { id: card.id },
          data: { accountId: account.id },
        });
      }
    }

    const settings = getNktSettings();
    const cleanUserKey = account?.nktApiKey ? account.nktApiKey.replace(/[^\x20-\x7E]/g, '').trim() : '';
    const effectiveApiKey = cleanUserKey || settings.apiKey;
    const effectiveBaseUrl =
      (account?.nktBaseUrl && account.nktBaseUrl.trim()) ||
      settings.baseUrl ||
      'https://nationalcatalog.kz/gwp';

    if (!effectiveApiKey) {
      throw new Error(
        'Отсутствует API-KEY Национального Каталога (НКТ). Укажите API-KEY в настройках аккаунта маркировки или обратитесь к администратору для подключения шлюза Tanbox.'
      );
    }

    const schema = CATEGORY_SCHEMAS[card.category];
    const effectiveOktru =
      (customAttrs.oktru && String(customAttrs.oktru).trim()) ||
      schema?.defaultOktru ||
      (card.category === 'OILS' ? '1087-0001-0001-100045841' : '1078-0008-0008-100044039');

    // Clean quantity: NKT strictly requires a valid number with dot (e.g. '1' or '2.5'), no text units like 'г' or 'кг'
    let cleanQuantity = '1';
    if (customAttrs.quantity) {
      const parsed = String(customAttrs.quantity).replace(',', '.').replace(/[^0-9.]/g, '');
      if (parsed && !isNaN(Number(parsed)) && Number(parsed) > 0) {
        cleanQuantity = parsed;
      }
    }

    // Map country to NCT dictionary code (ISO-2)
    const rawCountry = (card.country || '').trim().toUpperCase();
    let countryCode = 'KZ';
    if (rawCountry.includes('РОССИ') || rawCountry === 'RU' || rawCountry === 'RUS') {
      countryCode = 'RU';
    } else if (rawCountry.includes('КИТА') || rawCountry === 'CN' || rawCountry === 'CHN') {
      countryCode = 'CN';
    } else if (rawCountry.includes('УЗБЕК') || rawCountry === 'UZ') {
      countryCode = 'UZ';
    } else if (rawCountry.includes('ТУРЦ') || rawCountry === 'TR') {
      countryCode = 'TR';
    } else if (rawCountry.length === 2) {
      countryCode = rawCountry;
    }

    const producerTitle = card.producerName || card.user.companyName || 'ТОО';

    // Standard attributes expected by NCT Open API
    const measureUnitCode = String(customAttrs.measureUnit || '796');
    const attributesList: Array<{ code: string; value: string }> = [
      { code: 'name_kk', value: card.nameKk || card.name },
      { code: 'name_ru', value: card.name },
      { code: 'short_name_ru', value: card.name.slice(0, 35) },
      { code: 'short_name_kk', value: (card.nameKk || card.name).slice(0, 35) },
      { code: 'quantity', value: cleanQuantity },
      { code: 'measure_unit', value: measureUnitCode },
      { code: 'country', value: countryCode },
      { code: 'a4282e5d', value: producerTitle }, // Official NKT code for 'Наименование производителя'
    ];

    if (card.article) {
      attributesList.push({ code: 'article', value: card.article });
      attributesList.push({ code: 'good_vendor_code', value: card.article });
      attributesList.push({ code: 'vendor_code', value: card.article });
    }
    if (card.tnved) {
      attributesList.push({ code: 'tnved', value: card.tnved });
    }
    if (card.gtin) {
      attributesList.push({ code: 'gtin', value: card.gtin });
    }
    if (card.brand) {
      attributesList.push({ code: 'brand', value: card.brand });
    }
    if (producerTitle) {
      attributesList.push({ code: 'producer_name', value: producerTitle });
    }

    const isEaesBool = customAttrs.signEaes !== false;
    const isMarkingBool = customAttrs.markingRequired !== false;
    const isSzptBool = Boolean(customAttrs.isSzpt);

    // Compound '131777b5' (Признаки) as required by NKT schema
    attributesList.push({
      code: '131777b5',
      attributeCode: '131777b5',
      index: 1,
      attributes: [
        { code: 'eaes', attributeCode: 'eaes', value: isEaesBool },
        { code: 'marking_required_status', attributeCode: 'marking_required_status', value: isMarkingBool },
        { code: 'mandatory_marking_status', attributeCode: 'mandatory_marking_status', value: isMarkingBool },
      ],
    } as any);

    // Flat signs attributes (boolean values as expected by Jackson/NKT dataType: "boolean")
    attributesList.push({ code: 'eaes', attributeCode: 'eaes', value: isEaesBool } as any);
    attributesList.push({ code: 'marking_required_status', attributeCode: 'marking_required_status', value: isMarkingBool } as any);
    attributesList.push({ code: 'mandatory_marking_status', attributeCode: 'mandatory_marking_status', value: isMarkingBool } as any);
    if (isSzptBool) {
      attributesList.push({ code: 'szpt', attributeCode: 'szpt', value: true } as any);
      attributesList.push({ code: 'szpt_category', attributeCode: 'szpt_category', value: 'true' } as any);
    }

    // Compound 'measure' (Единицы измерения)
    attributesList.push({
      code: 'measure',
      attributeCode: 'measure',
      index: 1,
      attributes: [
        { code: 'measure_unit', attributeCode: 'measure_unit', value: measureUnitCode },
        { code: 'quantity', attributeCode: 'quantity', value: cleanQuantity },
      ],
    } as any);

    // Append custom category attributes
    for (const [code, val] of Object.entries(customAttrs)) {
      if (
        code !== 'oktru' &&
        code !== 'signEaes' &&
        code !== 'markingRequired' &&
        code !== 'isSzpt' &&
        code !== 'measureUnit' &&
        code !== 'quantity' &&
        val &&
        !attributesList.some((a) => a.code === code)
      ) {
        attributesList.push({ code, attributeCode: code, value: String(val) } as any);
      }
    }

    // Ensure all attributes have both code and attributeCode for compatibility with NKT parsers
    const finalAttributes = attributesList.map((a: any) => ({
      ...a,
      attributeCode: a.attributeCode || a.code,
      code: a.code || a.attributeCode,
    }));

    // Build payload according to NKT Open API format
    const nktPayload: any = {
      productName: card.name,
      productNameKz: card.nameKk || card.name,
      oktru: effectiveOktru,
      tradeMark: card.brand || '',
      vendorCode: card.article || '',
      article: card.article || '',
      good_vendor_code: card.article || '',
      model: card.model || '',
      tnvedCode: card.tnved,
      countryOfOrigin: card.country || 'Казахстан',
      producerName: card.producerName || card.user.companyName,
      producerAddress: card.producerAddress || '',
      importerName: card.importerName || card.account?.name || card.user.companyName,
      importerBin: card.importerBin || card.user.binIin,
      gostOrTu: card.gostOrTu || '',
      certificateType: card.certificateType || '',
      certificateNumber: card.certificateNumber || '',
      netWeight: card.netWeight || '',
      grossWeight: card.grossWeight || '',
      shelfLife: card.shelfLife || '',
      packageType: card.packageType,
      categoryCode: CATEGORY_SCHEMAS[card.category]?.code || 'other',
      attributes: finalAttributes,
      photos: card.photos,
      documents: card.documents,
      isMarked: isMarkingBool,
      is_marked: isMarkingBool,
      markingRequired: isMarkingBool,
      autoPublication: false, // Keep false on initial create so images can be uploaded while in status NEW
    };

    if (card.size) nktPayload.size = card.size;
    if (card.color) nktPayload.color = card.color;
    if (card.gtin) nktPayload.gtin = card.gtin;

    let nktRequestId = card.nktRequestId ? String(card.nktRequestId).trim() : '';
    let isUpdateRequest = false;

    // Check if card has an existing request in NKT that is in revision or draft
    if (nktRequestId) {
      try {
        const checkStatusUrl = `${effectiveBaseUrl}/portal/api/v1/products/requests/${encodeURIComponent(nktRequestId)}/status`;
        const checkRes = await fetch(checkStatusUrl, {
          headers: { 'X-API-KEY': effectiveApiKey, 'Accept': 'application/json' },
          signal: AbortSignal.timeout(6000),
        });
        if (checkRes.ok) {
          const stData: any = await checkRes.json().catch(() => null);
          const statusCode = String(stData?.code || stData?.status || '').toLowerCase();
          if (
            statusCode.includes('revision') ||
            statusCode.includes('new') ||
            statusCode.includes('draft') ||
            statusCode.includes('cancel') ||
            statusCode.includes('reject')
          ) {
            isUpdateRequest = true;
            logger.info(`[NKT Request] Existing request #${nktRequestId} is in status '${statusCode}', updating via PUT`);
          }
        }
      } catch (checkErr: any) {
        logger.warn(`[NKT Request] Could not check status of existing req #${nktRequestId}: ${checkErr.message}`);
      }
    }

    try {
      let responseData: any = null;

      if (isUpdateRequest) {
        const url = `${effectiveBaseUrl}/portal/api/v1/products/requests/${encodeURIComponent(nktRequestId)}`;
        logger.info(`[NKT Request] Updating existing request #${nktRequestId} for card ${card.id} at ${url}`);
        const res = await fetch(url, {
          method: 'PUT',
          headers: {
            'X-API-KEY': effectiveApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(nktPayload),
          signal: AbortSignal.timeout(15000),
        });
        responseData = await res.json().catch(() => null);
        if (!res.ok) {
          // If PUT failed (e.g. 404 or closed), fallback to creating new request via POST
          logger.warn(`[NKT Request] PUT request #${nktRequestId} failed (HTTP ${res.status}), creating new request via POST`);
          isUpdateRequest = false;
        }
      }

      if (!isUpdateRequest) {
        const url = `${effectiveBaseUrl}/portal/api/v1/products/requests`;
        logger.info(`[NKT Request] Submitting product card ${card.id} to ${url} with ${card.account?.nktApiKey ? 'user personal' : 'system'} key`);
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'X-API-KEY': effectiveApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(nktPayload),
          signal: AbortSignal.timeout(15000),
        });
        responseData = await res.json().catch(() => null);
        if (!res.ok) {
          const errorMsg = responseData?.message || responseData?.error || `Ошибка сервера НКТ (HTTP ${res.status})`;
          throw new Error(errorMsg);
        }
        nktRequestId = String(responseData?.id || responseData?.requestId || responseData?.data?.id || '');
        if (!nktRequestId) {
          throw new Error('НКТ не вернул номер созданной заявки');
        }
      }

      // 2. Upload photos to NKT storage endpoint: POST /portal/api/v1/storage/{requestId}/upload?imageType={type}
      // Note: Must be uploaded BEFORE transitioning to moderation!
      const uploadedImageFiles: Array<{ fileName: string; imageType: string }> = [];
      const imageTypes = ['front', 'back', 'left', 'right', 'top', 'bottom'];
      if (card.photos && Array.isArray(card.photos) && card.photos.length > 0) {
        logger.info(`[NKT Storage] Uploading ${card.photos.length} photos for req #${nktRequestId}`);
        for (let i = 0; i < card.photos.length; i++) {
          const photoItem = card.photos[i];
          const imageType = imageTypes[i] || 'front';
          try {
            let fileBlob: Blob | null = null;
            let filename = `photo_${i + 1}.jpg`;

            if (photoItem.startsWith('http://') || photoItem.startsWith('https://')) {
              const fetchImg = await fetch(photoItem, { signal: AbortSignal.timeout(10000) });
              if (fetchImg.ok) {
                const arrBuf = await fetchImg.arrayBuffer();
                const mime = fetchImg.headers.get('content-type') || 'image/jpeg';
                fileBlob = new Blob([arrBuf], { type: mime });
              }
            } else {
              // Local file in uploads/product-cards
              const localFilename = path.basename(photoItem);
              const localPath = path.resolve(process.cwd(), 'uploads/product-cards', localFilename);
              if (fs.existsSync(localPath)) {
                const buf = fs.readFileSync(localPath);
                const ext = path.extname(localFilename).toLowerCase();
                const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
                fileBlob = new Blob([buf], { type: mime });
                filename = localFilename;
              }
            }

            if (fileBlob) {
              const form = new FormData();
              form.append('file', fileBlob, filename);
              const uploadUrl = `${effectiveBaseUrl}/portal/api/v1/storage/${encodeURIComponent(nktRequestId)}/upload?imageType=${imageType}`;
              const upRes = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                  'X-API-KEY': effectiveApiKey,
                },
                body: form,
                signal: AbortSignal.timeout(20000),
              });
              const upText = await upRes.text();
              logger.info(`[NKT Storage] Uploaded photo ${i + 1} (${imageType}) to #${nktRequestId}: HTTP ${upRes.status} ${upText.slice(0, 80)}`);
              try {
                const upJson = JSON.parse(upText);
                const assignedFilename = upJson?.filename || upJson?.fileName;
                if (assignedFilename) {
                  uploadedImageFiles.push({ fileName: assignedFilename, imageType });
                }
              } catch (_) {}
            }
          } catch (uploadErr: any) {
            logger.warn(`[NKT Storage] Failed to upload photo ${i + 1} for #${nktRequestId}: ${uploadErr.message}`);
          }
        }
      }

      // 3. Update request with attached imageFiles and set autoPublication: true
      const updatePayload: any = {
        ...nktPayload,
        autoPublication: true,
      };
      if (uploadedImageFiles.length > 0) {
        updatePayload.imageFiles = uploadedImageFiles;
        updatePayload.photos = uploadedImageFiles.map((f) => f.fileName);
      }

      const updateReqUrl = `${effectiveBaseUrl}/portal/api/v1/products/requests/${encodeURIComponent(nktRequestId)}`;
      logger.info(`[NKT Request] Attaching imageFiles (${uploadedImageFiles.length} photos) to request #${nktRequestId}`);
      await fetch(updateReqUrl, {
        method: 'PUT',
        headers: {
          'X-API-KEY': effectiveApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(updatePayload),
        signal: AbortSignal.timeout(15000),
      }).catch((e) => {
        logger.warn(`[NKT Request] Updating request with imageFiles failed: ${e.message}`);
      });

      // 3. Automatically transition draft/revision request to moderation in NKT (PUT /portal/api/v1/products/requests/{id}/moderation)
      let moderationSucceeded = false;
      let moderationError: string | null = null;
      try {
        const moderationUrl = `${effectiveBaseUrl}/portal/api/v1/products/requests/${encodeURIComponent(nktRequestId)}/moderation`;
        logger.info(`[NKT Request] Transitioning card ${card.id} (req #${nktRequestId}) to moderation at ${moderationUrl}`);

        const modRes = await fetch(moderationUrl, {
          method: 'PUT',
          headers: {
            'X-API-KEY': effectiveApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(15000),
        });

        if (modRes.ok) {
          moderationSucceeded = true;
          logger.info(`[NKT Request] Successfully transitioned req #${nktRequestId} to moderation`);
        } else {
          const modErrData: any = await modRes.json().catch(() => null);
          moderationError = modErrData?.message || modErrData?.error || `HTTP ${modRes.status}`;
          logger.warn(`[NKT Request] Moderation transition returned: ${moderationError}`);
        }
      } catch (modErr: any) {
        moderationError = modErr.message;
        logger.warn(`[NKT Request] Failed to trigger moderation PUT for #${nktRequestId}: ${modErr.message}`);
      }

      // If NKT immediately assigned GTIN (auto-approval)
      const assignedGtin = responseData?.gtin || responseData?.ntin || responseData?.data?.gtin || null;

      const finalStatus = assignedGtin
        ? MarkirovkaCardStatus.APPROVED
        : moderationSucceeded
        ? MarkirovkaCardStatus.PENDING_MODERATION
        : MarkirovkaCardStatus.DRAFT;

      const updated = await prisma.markirovkaProductCard.update({
        where: { id: card.id },
        data: {
          status: finalStatus,
          nktRequestId,
          gtin: assignedGtin || card.gtin,
          moderationComment: moderationError ? `Заявка #${nktRequestId}, отправка на модерацию: ${moderationError}` : null,
        },
      });

      return {
        success: true,
        requestId: nktRequestId,
        status: updated.status,
        gtin: updated.gtin,
        moderationSucceeded,
        message: moderationSucceeded
          ? `Заявка №${nktRequestId} успешно создана и отправлена на модерацию в НКТ`
          : `Заявка №${nktRequestId} создана в НКТ в статусе черновика`,
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
      include: { account: true },
    });

    if (!card || !card.nktRequestId) {
      return card;
    }

    let account = card.account;
    if (!account && card.userId) {
      account = await prisma.markirovkaAccount.findFirst({
        where: { userId: card.userId },
        orderBy: { createdAt: 'desc' },
      });
      if (account) {
        await prisma.markirovkaProductCard.update({
          where: { id: card.id },
          data: { accountId: account.id },
        });
      }
    }

    const settings = getNktSettings();
    const cleanUserKey = account?.nktApiKey ? account.nktApiKey.replace(/[^\x20-\x7E]/g, '').trim() : '';
    const effectiveApiKey = cleanUserKey || settings.apiKey;
    const effectiveBaseUrl =
      (account?.nktBaseUrl && account.nktBaseUrl.trim()) ||
      settings.baseUrl ||
      'https://nationalcatalog.kz/gwp';

    if (!effectiveApiKey) {
      throw new Error('API-ключ НКТ не настроен в аккаунте');
    }

    try {
      // 1. Query official status endpoint
      const statusUrl = `${effectiveBaseUrl}/portal/api/v1/products/requests/${encodeURIComponent(card.nktRequestId)}/status`;
      const res = await fetch(statusUrl, {
        headers: {
          'X-API-KEY': effectiveApiKey,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const errData: any = await res.json().catch(() => null);
        const errMsg = String(errData?.message || errData?.error || '');

        const isNotFound =
          res.status === 404 ||
          res.status === 410 ||
          (res.status === 422 && errMsg.toLowerCase().includes('не найден')) ||
          errMsg.toLowerCase().includes('не найден') ||
          errMsg.toLowerCase().includes('not found');

        if (isNotFound) {
          logger.info(`[NKT Status Check] Request #${card.nktRequestId} not found in NKT (deleted/cancelled). Resetting card ${card.id} to DRAFT`);
          return await prisma.markirovkaProductCard.update({
            where: { id: card.id },
            data: {
              status: MarkirovkaCardStatus.DRAFT,
              moderationComment: `Заявка №${card.nktRequestId} не найдена в НКТ (удалена или отменена в личном кабинете). Карточка переведена в статус «Черновик».`,
              nktRequestId: null,
            },
          });
        }

        if (res.status === 401) {
          throw new Error('Ошибка авторизации в НКТ (401 Unauthorized). Проверьте API-ключ в настройках аккаунта.');
        }

        throw new Error(errMsg || `Ошибка НКТ HTTP ${res.status}`);
      }

      const data: any = await res.json().catch(() => null);
      if (data) {
        const code = String(data.code || data.status || data.state || data.data?.status || '').toLowerCase();
        const value = String(data.value || '').toLowerCase();
        const gtin = data.ntinCode || data.gtinCode || data.gtin || data.ntin || data.data?.gtin || data.data?.ntin || null;
        let rejectionReason = data.rejectionReason || data.comment || data.moderationComment || data.reason || null;
        if (data.photoModeration?.comment) {
          const scoreText = data.photoModeration.score != null ? ` (Оценка ИИ: ${data.photoModeration.score}%)` : '';
          const aiComment = `Вердикт робота-модератора НКТ по фото${scoreText}:\n${data.photoModeration.comment}`;
          if (rejectionReason && rejectionReason !== 'Изображения не прошли проверку ИИ') {
            rejectionReason = `${rejectionReason}\n\n${aiComment}`;
          } else {
            rejectionReason = aiComment;
          }
        }

        let newStatus = card.status;
        if (
          code.includes('complet') ||
          code.includes('approv') ||
          code.includes('publish') ||
          value.includes('выполн') ||
          value.includes('одобр') ||
          value.includes('опублик') ||
          Boolean(gtin)
        ) {
          newStatus = MarkirovkaCardStatus.APPROVED;
        } else if (
          code.includes('reject') ||
          code.includes('declin') ||
          code.includes('revis') ||
          value.includes('отклон') ||
          value.includes('доработ')
        ) {
          newStatus = MarkirovkaCardStatus.REJECTED;
        } else if (
          code.includes('moderat') ||
          code.includes('progress') ||
          code.includes('pending') ||
          code.includes('review') ||
          value.includes('рассмотр') ||
          value.includes('модерац')
        ) {
          newStatus = MarkirovkaCardStatus.PENDING_MODERATION;
        } else if (
          code.includes('new') ||
          code.includes('draft') ||
          value.includes('чернов') ||
          value.includes('новая')
        ) {
          newStatus = MarkirovkaCardStatus.DRAFT;
        }

        const productUrl = data.productUrl || data.data?.productUrl || null;
        let finalProductUrl = productUrl;

        // If card was approved but not published yet, auto-publish it via PUT /publish
        if (newStatus === MarkirovkaCardStatus.APPROVED && !finalProductUrl && card.nktRequestId) {
          try {
            const pubUrl = `${effectiveBaseUrl}/portal/api/v1/products/requests/${encodeURIComponent(card.nktRequestId)}/publish`;
            const pubRes = await fetch(pubUrl, {
              method: 'PUT',
              headers: { 'X-API-KEY': effectiveApiKey, 'Accept': 'application/json' },
              signal: AbortSignal.timeout(10000),
            });
            if (pubRes.ok) {
              logger.info(`[NKT Auto-Publish] Published card ${card.id} (req #${card.nktRequestId})`);
              const sRes = await fetch(statusUrl, {
                headers: { 'X-API-KEY': effectiveApiKey, 'Accept': 'application/json' },
                signal: AbortSignal.timeout(5000),
              });
              if (sRes.ok) {
                const sData: any = await sRes.json().catch(() => null);
                if (sData?.productUrl) finalProductUrl = sData.productUrl;
              }
            }
          } catch (pubErr: any) {
            logger.warn(`[NKT Auto-Publish] Failed for #${card.nktRequestId}: ${pubErr.message}`);
          }
        }

        const customAttrs = (card.attributes as any) || {};
        if (finalProductUrl) customAttrs.productUrl = finalProductUrl;
        if (finalProductUrl || Boolean(data.ntinCode)) customAttrs.isPublished = true;

        return await prisma.markirovkaProductCard.update({
          where: { id: card.id },
          data: {
            status: newStatus,
            gtin: gtin || card.gtin,
            mptCardId: finalProductUrl || card.mptCardId,
            attributes: customAttrs,
            moderationComment: rejectionReason || (newStatus === MarkirovkaCardStatus.APPROVED ? null : card.moderationComment),
          },
        });
      }
    } catch (e: any) {
      logger.warn(`[NKT Status Check] Failed for card ${cardId}: ${e.message}`);
      throw e;
    }

    return card;
  }

  /**
   * Publishes approved product card in NKT (PUT /portal/api/v1/products/requests/{id}/publish)
   */
  public async publishToNkt(cardId: string, userId: string, isAdmin: boolean) {
    const card = await prisma.markirovkaProductCard.findUnique({
      where: { id: cardId },
      include: { account: true, user: true },
    });

    if (!card) {
      throw new Error('Карточка товара не найдена');
    }
    if (!isAdmin && card.userId !== userId) {
      throw new Error('Нет доступа к данной карточке');
    }
    if (!card.nktRequestId) {
      throw new Error('Карточка еще не была отправлена в НКТ');
    }

    let account = card.account;
    if (!account && card.userId) {
      account = await prisma.markirovkaAccount.findFirst({
        where: { userId: card.userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    const settings = getNktSettings();
    const cleanUserKey = account?.nktApiKey ? account.nktApiKey.replace(/[^\x20-\x7E]/g, '').trim() : '';
    const effectiveApiKey = cleanUserKey || settings.apiKey;
    const effectiveBaseUrl =
      (account?.nktBaseUrl && account.nktBaseUrl.trim()) ||
      settings.baseUrl ||
      'https://nationalcatalog.kz/gwp';

    if (!effectiveApiKey) {
      throw new Error('Отсутствует API-ключ НКТ в настройках аккаунта');
    }

    const publishUrl = `${effectiveBaseUrl}/portal/api/v1/products/requests/${encodeURIComponent(card.nktRequestId)}/publish`;
    logger.info(`[NKT Publish] Publishing request #${card.nktRequestId} at ${publishUrl}`);

    const res = await fetch(publishUrl, {
      method: 'PUT',
      headers: {
        'X-API-KEY': effectiveApiKey,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errData: any = await res.json().catch(() => null);
      const errMsg = errData?.message || errData?.error || `Ошибка публикации (HTTP ${res.status})`;
      throw new Error(errMsg);
    }

    // Query status to get updated productUrl
    const statusUrl = `${effectiveBaseUrl}/portal/api/v1/products/requests/${encodeURIComponent(card.nktRequestId)}/status`;
    let productUrl: string | null = null;
    let ntinCode: string | null = null;
    try {
      const sRes = await fetch(statusUrl, {
        headers: { 'X-API-KEY': effectiveApiKey, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (sRes.ok) {
        const sData: any = await sRes.json().catch(() => null);
        productUrl = sData?.productUrl || null;
        ntinCode = sData?.ntinCode || sData?.gtinCode || null;
      }
    } catch (e) {}

    const customAttrs = (card.attributes as any) || {};
    if (productUrl) customAttrs.productUrl = productUrl;
    customAttrs.isPublished = true;

    const updated = await prisma.markirovkaProductCard.update({
      where: { id: card.id },
      data: {
        status: MarkirovkaCardStatus.APPROVED,
        mptCardId: productUrl || ntinCode || card.mptCardId,
        attributes: customAttrs,
      },
    });

    return {
      card: updated,
      productUrl,
      ntinCode,
    };
  }

  /**
   * Fetches paginated list of product cards with filters
   */
  public async getCards(userId: string, isAdmin: boolean, query: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    accountId?: string;
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

    if (query.accountId) {
      where.accountId = query.accountId;
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
            select: { id: true, name: true, login: true, categories: true },
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
