export interface ParsedOrderNotes {
  address: string | null;
  clientNote: string | null;
  stickerDesign: string | null;
}

/**
 * Parses composite order notes containing warehouse address, sticker requirements,
 * and user comments into clean, separated entities.
 */
export function parseOrderNotes(notes?: string | null): ParsedOrderNotes {
  if (!notes || !notes.trim()) {
    return { address: null, clientNote: null, stickerDesign: null };
  }

  let remaining = notes.trim();
  let stickerDesign: string | null = null;
  let address: string | null = null;
  let clientNote: string | null = null;

  // 1. Strip technical template usage blocks if present
  const templateMatch = remaining.match(/=== МАКЕТ ЭТИКЕТКИ: ИСПОЛЬЗОВАН СОХРАНЁННЫЙ ШАБЛОН ===[\s\S]*?(?:={20,}|$)/);
  if (templateMatch) {
    remaining = remaining.replace(templateMatch[0], '').trim();
  }

  // 2. Extract sticker layout design block if present
  const stickerMatch = remaining.match(/=== ТРЕБОВАНИЯ К МАКЕТУ СТИКЕРА ===[\s\S]*?(?:={20,}|$)/);
  if (stickerMatch) {
    stickerDesign = stickerMatch[0].trim();
    remaining = remaining.replace(stickerMatch[0], '').trim();
  }

  // 2. Extract warehouse address
  const addressMatch = remaining.match(/Адрес склада(?: в РК)?:?\s*([\s\S]*?)(?=(?:Примечания?:|===|$))/i);
  if (addressMatch) {
    const rawAddr = addressMatch[1].trim();
    if (rawAddr) {
      address = rawAddr;
    }
    remaining = remaining.replace(/Адрес склада(?: в РК)?:?[\s\S]*?(?=(?:Примечания?:|===|$))/i, '').trim();
  }

  // 3. Extract client note
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
  };
}
