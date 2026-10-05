export interface WarehouseStickeringInfo {
  storageType?: string;
  storageTypeCode?: 'PALLETS' | 'BOXES' | 'LOOSE';
  climate?: string;
  climateCode?: 'WARM_HEATED' | 'COLD_WINTER' | 'HOT_SUMMER' | 'RAMP_CUSTOMS';
  equipment?: string;
  equipmentCode?: 'HAS_EQUIPMENT' | 'MANUAL';
  slaNotice?: string;
}

export interface ConfirmedStickeringEstimate {
  date?: string;
  workersCount?: number;
  daysNeeded?: number;
  manHours?: number;
  clientPricePerUnit?: number;
  totalPrice?: number;
  warehouseCondition?: string;
  materials?: string;
  tapeRollsNeeded?: number;
  stretchRollsNeeded?: number;
}

export interface ParsedOrderNotes {
  address: string | null;
  clientNote: string | null;
  stickerDesign: string | null;
  warehouseConditions: WarehouseStickeringInfo | null;
  confirmedEstimate: ConfirmedStickeringEstimate | null;
}

/**
 * Parses composite order notes containing warehouse address, sticker requirements,
 * warehouse on-site stickering conditions, confirmed estimates, and user comments into clean, separated entities.
 */
export function parseOrderNotes(notes?: string | null): ParsedOrderNotes {
  if (!notes || !notes.trim()) {
    return {
      address: null,
      clientNote: null,
      stickerDesign: null,
      warehouseConditions: null,
      confirmedEstimate: null,
    };
  }

  let remaining = notes.trim();
  let stickerDesign: string | null = null;
  let address: string | null = null;
  let clientNote: string | null = null;
  let warehouseConditions: WarehouseStickeringInfo | null = null;
  let confirmedEstimate: ConfirmedStickeringEstimate | null = null;

  // 1. Strip technical template usage blocks if present
  const templateMatch = remaining.match(/=== МАКЕТ ЭТИКЕТКИ: ИСПОЛЬЗОВАН СОХРАНЁННЫЙ ШАБЛОН ===[\s\S]*?(?:={20,}|$)/);
  if (templateMatch) {
    remaining = remaining.replace(templateMatch[0], '').trim();
  }

  // 2. Extract sticker layout design block if present
  const stickerMatch = remaining.match(/=== ТРЕБОВАНИЯ К МАКЕТУ СТИКЕРА(?: \(РК\))? ===[\s\S]*?(?:={20,}|$)/);
  if (stickerMatch) {
    stickerDesign = stickerMatch[0].trim();
    remaining = remaining.replace(stickerMatch[0], '').trim();
  }

  // 3. Extract confirmed stickering estimate if present
  const estimateMatch = remaining.match(/=== УТВЕРЖДЕННАЯ СМЕТА ВЫЕЗДНОЙ ОКЛЕЙКИ ===([\s\S]*?)(?:={20,}|$)/i);
  if (estimateMatch) {
    const blockContent = estimateMatch[1].trim();
    remaining = remaining.replace(estimateMatch[0], '').trim();

    const dateMatch = blockContent.match(/Дата расчета:\s*([^\n\r]+)/i);
    const workersMatch = blockContent.match(/Бригада:\s*(\d+)\s*чел/i);
    const daysMatch = blockContent.match(/Срок выполнения:\s*([\d.]+)\s*раб/i);
    const hoursMatch = blockContent.match(/~?([\d.]+)\s*чел\.-ч/i);
    const priceMatch = blockContent.match(/Тариф оклейки:\s*([\d.]+)/i);
    const totalMatch = blockContent.match(/Итоговая стоимость:\s*([^\n\r]+)/i);
    const condMatch = blockContent.match(/Условия склада:\s*([^\n\r]+)/i);
    const matMatch = blockContent.match(/Расходные материалы:\s*([^\n\r]+)/i);
    const tapeMatch = blockContent.match(/скотч\s*(\d+)\s*рул/i);
    const stretchMatch = blockContent.match(/стрейч[^\d]*(\d+)\s*рул/i);

    confirmedEstimate = {
      date: dateMatch ? dateMatch[1].trim() : undefined,
      workersCount: workersMatch ? parseInt(workersMatch[1], 10) : undefined,
      daysNeeded: daysMatch ? parseFloat(daysMatch[1]) : undefined,
      manHours: hoursMatch ? parseFloat(hoursMatch[1]) : undefined,
      clientPricePerUnit: priceMatch ? parseFloat(priceMatch[1]) : undefined,
      totalPrice: totalMatch ? parseFloat(totalMatch[1].replace(/[^\d.]/g, '')) : undefined,
      warehouseCondition: condMatch ? condMatch[1].trim() : undefined,
      materials: matMatch ? matMatch[1].trim() : undefined,
      tapeRollsNeeded: tapeMatch ? parseInt(tapeMatch[1], 10) : undefined,
      stretchRollsNeeded: stretchMatch ? parseInt(stretchMatch[1], 10) : undefined,
    };
  }

  // 4. Extract warehouse on-site stickering conditions block if present
  const warehouseMatch = remaining.match(/=== СКЛАДСКИЕ УСЛОВИЯ \((?:ВЫЕЗДНАЯ ОКЛЕЙКА|НА СКЛАДЕ)\) ===([\s\S]*?)(?:={20,}|$)/i);
  if (warehouseMatch) {
    const blockContent = warehouseMatch[1].trim();
    remaining = remaining.replace(warehouseMatch[0], '').trim();

    const storageLine = blockContent.match(/(?:Размещение|Хранение):\s*([^\n\r]+)/i);
    const climateLine = blockContent.match(/(?:Температурный режим|Климат):\s*([^\n\r]+)/i);
    const equipmentLine = blockContent.match(/(?:Складская техника|Техника):\s*([^\n\r]+)/i);

    const storageText = storageLine ? storageLine[1].trim() : '';
    const climateText = climateLine ? climateLine[1].trim() : '';
    const equipmentText = equipmentLine ? equipmentLine[1].trim() : '';

    let storageCode: 'PALLETS' | 'BOXES' | 'LOOSE' = 'PALLETS';
    if (/стеллаж|пол|коробк/i.test(storageText)) storageCode = 'BOXES';
    if (/россып|мешк/i.test(storageText)) storageCode = 'LOOSE';

    let climateCode: 'WARM_HEATED' | 'COLD_WINTER' | 'HOT_SUMMER' | 'RAMP_CUSTOMS' = 'WARM_HEATED';
    if (/холод|зима|мороз/i.test(climateText)) climateCode = 'COLD_WINTER';
    else if (/жара|лето|зной/i.test(climateText)) climateCode = 'HOT_SUMMER';
    else if (/пандус|свх|улиц/i.test(climateText)) climateCode = 'RAMP_CUSTOMS';

    let equipmentCode: 'HAS_EQUIPMENT' | 'MANUAL' = 'HAS_EQUIPMENT';
    if (/нет|вручную|отсутств/i.test(equipmentText)) equipmentCode = 'MANUAL';

    warehouseConditions = {
      storageType: storageText || undefined,
      storageTypeCode: storageCode,
      climate: climateText || undefined,
      climateCode: climateCode,
      equipment: equipmentText || undefined,
      equipmentCode: equipmentCode,
      slaNotice: 'Расчет сметы в течение 2 часов',
    };
  }

  // 5. Extract warehouse address
  const addressMatch = remaining.match(/Адрес склада(?: в РК)?:?\s*([\s\S]*?)(?=(?:Примечания?:|=== СКЛАДСКИЕ|=== УТВЕРЖДЕННАЯ|$))/i);
  if (addressMatch) {
    const rawAddr = addressMatch[1].trim();
    if (rawAddr) {
      address = rawAddr;
    }
    remaining = remaining.replace(/Адрес склада(?: в РК)?:?[\s\S]*?(?=(?:Примечания?:|=== СКЛАДСКИЕ|=== УТВЕРЖДЕННАЯ|$))/i, '').trim();
  }

  // 6. Extract client note
  const notesMatch = remaining.match(/Примечания?:?\s*([\s\S]*)/i);
  if (notesMatch) {
    const rawNote = notesMatch[1].trim();
    if (rawNote) {
      clientNote = rawNote;
    }
  } else if (remaining.trim()) {
    clientNote = remaining.trim();
  }

  return {
    address,
    clientNote,
    stickerDesign,
    warehouseConditions,
    confirmedEstimate,
  };
}
