import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface NktSettings {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  updatedAt?: string;
  updatedBy?: string;
}

const SETTINGS_FILE = path.resolve(__dirname, '../../storage/settings/nkt.json');

const DEFAULT_SETTINGS: NktSettings = {
  enabled: true,
  apiKey: process.env.NATIONAL_CATALOG_API_KEY || '',
  baseUrl: process.env.NATIONAL_CATALOG_BASE_URL || 'https://nationalcatalog.kz/gwp',
};

let cachedSettings: NktSettings | null = null;

export function getNktSettings(): NktSettings {
  if (cachedSettings) return cachedSettings;

  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      cachedSettings = {
        enabled: typeof data.enabled === 'boolean' ? data.enabled : true,
        apiKey: (data.apiKey && String(data.apiKey).trim()) || DEFAULT_SETTINGS.apiKey,
        baseUrl: (data.baseUrl && String(data.baseUrl).trim()) || DEFAULT_SETTINGS.baseUrl,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
      };
      return cachedSettings;
    }
  } catch (err: any) {
    logger.warn(`[NKT Settings] Could not read ${SETTINGS_FILE}: ${err.message}`);
  }

  cachedSettings = { ...DEFAULT_SETTINGS };
  return cachedSettings;
}

export function saveNktSettings(updates: Partial<NktSettings>, updatedBy?: string): NktSettings {
  const current = getNktSettings();
  const next: NktSettings = {
    enabled: typeof updates.enabled === 'boolean' ? updates.enabled : current.enabled,
    apiKey: (updates.apiKey && String(updates.apiKey).trim()) || current.apiKey,
    baseUrl: (updates.baseUrl && String(updates.baseUrl).trim()) || current.baseUrl,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || current.updatedBy,
  };

  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf-8');
    cachedSettings = next;
    logger.info(`[NKT Settings] Updated successfully: enabled=${next.enabled}`);
  } catch (err: any) {
    logger.error(`[NKT Settings] Failed to write ${SETTINGS_FILE}: ${err.message}`);
    cachedSettings = next;
  }

  return next;
}

export async function testNktApiConnection(apiKey?: string, gtin: string = '0200120931509'): Promise<{
  success: boolean;
  message: string;
  sampleProduct?: any;
  latencyMs?: number;
}> {
  const settings = getNktSettings();
  const keyToUse = (apiKey && apiKey.trim()) || settings.apiKey;
  const start = Date.now();

  try {
    const url = `${settings.baseUrl}/portal/api/v1/products/${encodeURIComponent(gtin)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': keyToUse,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(7000),
    });
    const latencyMs = Date.now() - start;

    if (res.ok) {
      const data: any = await res.json();
      return {
        success: true,
        message: `Связь с сервером НКТ установлена (${latencyMs} мс). Товар получен: "${data.nameRu || data.nameKk || data.id}".`,
        sampleProduct: {
          gtin: data.gtin || gtin,
          name: data.nameRu || data.nameKk || data.id,
          brand: data.brandName || data.brand,
          status: data.status || 'OK',
        },
        latencyMs,
      };
    } else {
      const text = await res.text();
      return {
        success: false,
        message: `НКТ ответил ошибкой HTTP ${res.status}: ${text.slice(0, 200)}`,
        latencyMs,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Не удалось связаться с сервером НКТ: ${err.message}`,
      latencyMs: Date.now() - start,
    };
  }
}
