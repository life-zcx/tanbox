import { OrderCategory, MarkirovkaEnvironment, MarkirovkaAccount } from '@prisma/client';
import { prisma } from '../config/db';
import { decryptText } from '../utils/encryption';
import { logger } from '../utils/logger';

// Category to OMS / True API extension mapping for Kazakhstan IS MPT
export const CATEGORY_TO_OMS_EXTENSION: Record<OrderCategory, string> = {
  SHOES: 'shoes',
  TEXTILE: 'clothes',
  MEDICINE: 'pharma',
  WATER: 'water',
  TOBACCO: 'tobacco',
  BEER: 'beer',
  DIETARY_SUPPLEMENTS: 'dietary_supplements',
  OILS: 'autofluids',
  JEWELRY: 'jewelry',
  SAIGA: 'saiga',
  OTHER: 'other',
};

export const CATEGORY_LABELS: Record<OrderCategory, string> = {
  SHOES: 'Обувные товары (shoes)',
  TEXTILE: 'Товары легпрома / текстиль (clothes)',
  MEDICINE: 'Лекарственные средства (pharma)',
  WATER: 'Упакованная вода и напитки (water)',
  TOBACCO: 'Табачная продукция (tobacco)',
  BEER: 'Пиво и пивные напитки (beer)',
  DIETARY_SUPPLEMENTS: 'БАДы (dietary_supplements)',
  OILS: 'Моторные масла (oils)',
  JEWELRY: 'Ювелирные изделия (jewelry)',
  SAIGA: 'Дериваты сайгака (saiga)',
  OTHER: 'Прочая продукция (other)',
};

export function getDefaultBaseUrl(env: MarkirovkaEnvironment): string {
  if (env === MarkirovkaEnvironment.TEST) {
    return 'https://test.markirovka.kz';
  }
  return 'https://prod.markirovka.kz';
}

/**
 * Recursively sort JSON object keys alphabetically (A-Z)
 * as required by Kazakhstan xTrace ICOM REST API specification.
 */
export function sortKeysAlphabetically(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortKeysAlphabetically);
  }
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, any> = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = sortKeysAlphabetically(obj[key]);
      });
    return sorted;
  }
  return obj;
}

/**
 * Generate a valid 18-digit GS1 SSCC (Serial Shipping Container Code)
 * Structure:
 * 1 digit: Extension (0)
 * 7 digits: GS1 Kazakhstan prefix (0487000)
 * 9 digits: Serial reference (timestamp)
 * 1 digit: GS1 Modulo-10 checksum
 */
export function generateValidSscc18(companyPrefix: string = '0487000'): string {
  const ext = '0';
  const prefix = companyPrefix.replace(/\D/g, '').slice(0, 7).padStart(7, '0');
  const serial = Date.now().toString().slice(-9);
  const base17 = `${ext}${prefix}${serial}`.slice(0, 17);

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const weight = i % 2 === 0 ? 3 : 1;
    sum += parseInt(base17[i], 10) * weight;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `00${base17}${checkDigit}`;
}

export function normalizeSscc18(input?: string): string {
  if (!input || !input.trim()) return generateValidSscc18();
  let clean = input.replace(/\D/g, '').trim();

  // If already 20 digits starting with 00:
  if (clean.length === 20 && clean.startsWith('00')) {
    const payload17 = clean.slice(2, 19);
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const weight = i % 2 === 0 ? 3 : 1;
      sum += parseInt(payload17[i], 10) * weight;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return `00${payload17}${checkDigit}`;
  }

  // If 18 digits (payload without AI 00):
  if (clean.length === 18) {
    const payload17 = clean.slice(0, 17);
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const weight = i % 2 === 0 ? 3 : 1;
      sum += parseInt(payload17[i], 10) * weight;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return `00${payload17}${checkDigit}`;
  }

  // If other length >= 17:
  if (clean.length >= 17) {
    const payload17 = clean.replace(/^00/, '').slice(0, 17).padEnd(17, '0');
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const weight = i % 2 === 0 ? 3 : 1;
      sum += parseInt(payload17[i], 10) * weight;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return `00${payload17}${checkDigit}`;
  }

  return generateValidSscc18();
}

/**
 * Извлекает чистый Код Идентификации (КИ) или нормализованный SSCC из полного кода маркировки DataMatrix.
 * В юридические документы xTrace ICOM (ввод в оборот/импорт, агрегация, вывод из оборота, списание)
 * согласно регламенту ИС МПТ передается ТОЛЬКО Код Идентификации (без криптохвоста 91 и 92).
 */
export function extractIdentificationCode(raw?: string): string {
  if (!raw) return '';
  let code = raw.trim();

  // Удаляем невидимые символы (BOM, zero-width space и т.д.)
  code = code.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

  // Если это транспортный код SSCC:
  if (code.startsWith('00') && /^\d{18,20}$/.test(code)) {
    return normalizeSscc18(code);
  }
  if (/^\d{18}$/.test(code)) {
    return normalizeSscc18(code);
  }

  // 1. Если присутствует символ-разделитель GS (\x1d, \u001d или текстовое обозначение <GS>)
  const gsIndex = code.search(/[\x1d\u001d]|<GS>/i);
  if (gsIndex !== -1) {
    code = code.slice(0, gsIndex).trim();
  }

  // 2. Стандартный DataMatrix формата GS1: 01 + 14 цифр GTIN + 21 + серийный номер
  const match0121 = code.match(/^01(\d{14})21(.+)$/);
  if (match0121) {
    const gtin = match0121[1];
    const serialAndTail = match0121[2];

    // Если разделитель GS был потерян при копировании через буфер обмена:
    // Криптохвост начинается с идентификатора применения 91 (4 символа ключа проверки) и 92 (подпись)
    const cryptoMatch = serialAndTail.match(/^(.*?)(?:91[^\s]{4}92.+|91[a-zA-Z0-9+/=]{4}92.*)$/);
    if (cryptoMatch && cryptoMatch[1] && cryptoMatch[1].length >= 6) {
      return `01${gtin}21${cryptoMatch[1]}`;
    }

    // Если серийный номер стандартной длины 13 символов (для обуви, одежды и т.д. в ИС МПТ КЗ)
    // и после 13-го символа идет '91':
    if (serialAndTail.length >= 15 && serialAndTail.slice(13, 15) === '91') {
      return `01${gtin}21${serialAndTail.slice(0, 13)}`;
    }

    // Если длина полного кода более 70 символов (полный код с криптоподписью 85+ символов)
    if (code.length >= 70 && serialAndTail.length >= 13) {
      return `01${gtin}21${serialAndTail.slice(0, 13)}`;
    }
  }

  return code;
}

export interface AuthResult {
  token: string;
  expiresAt: Date;
  rawResponse?: any;
}

export interface CreateOrderParams {
  category: OrderCategory;
  gtin: string;
  quantity: number;
  serialNumberType?: 'OPERATOR' | 'SELF_MADE';
  templateId?: number;
}

export interface UtilisationParams {
  category: OrderCategory;
  gtin?: string;
  codes: string[];
  productionDate?: string | Date;
  expirationDate?: string | Date;
  manufacturerCountry?: string;
  releaseType?: 'PRODUCTION' | 'IMPORT' | 'REMAINDER' | string;
  series?: string;
  businessPlaceId?: number | string;
  factoryName?: string;
  factoryAddress?: string;
}

export class MarkirovkaClient {
  private account: MarkirovkaAccount;
  private baseUrl: string;
  private decryptedPassword: string;

  constructor(account: MarkirovkaAccount) {
    this.account = account;
    this.baseUrl = (account.baseUrl || getDefaultBaseUrl(account.environment)).replace(/\/+$/, '');
    this.decryptedPassword = decryptText(account.encryptedPassword);
  }

  /**
   * Performs authentication using login and password against markirovka.kz endpoints.
   * Tries primary and fallback endpoints used by Kazakhstan IS MPT / True API / OMS.
   */
  public async authenticate(forceRefresh: boolean = false): Promise<AuthResult> {
    // Check cached token if not forced
    if (
      !forceRefresh &&
      this.account.token &&
      this.account.tokenExpiresAt &&
      new Date(this.account.tokenExpiresAt).getTime() > Date.now() + 5 * 60 * 1000
    ) {
      return {
        token: this.account.token,
        expiresAt: new Date(this.account.tokenExpiresAt),
      };
    }

    const login = this.account.login.trim();
    const password = this.decryptedPassword;

    // Potential endpoints supported by Kazakhstan ICOM REST API / xTrace / OMS
    const candidateEndpoints = [
      {
        path: '/api/users/authenticate',
        method: 'POST',
        body: { login: login, password: password },
      },
      {
        path: '/api/v1/party/users/authenticate',
        method: 'POST',
        body: { login: login, password: password },
      },
      {
        path: '/api/v3/true-api/auth/token',
        method: 'POST',
        body: { userName: login, password: password },
      },
      {
        path: '/api/v3/true-api/auth/token',
        method: 'POST',
        body: { login: login, password: password },
      },
      {
        path: '/auth/token',
        method: 'POST',
        body: { userName: login, password: password },
      },
      {
        path: '/api/v2/auth/token',
        method: 'POST',
        body: { username: login, password: password },
      },
      {
        path: '/api/v3/auth/token',
        method: 'POST',
        body: { userName: login, password: password },
      },
      {
        path: `/token?userName=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`,
        method: 'GET',
        body: null,
      },
    ];

    let lastError: any = null;
    let authResponse: any = null;

    for (const candidate of candidateEndpoints) {
      try {
        const fullUrl = `${this.baseUrl}${candidate.path}`;
        const res = await fetch(fullUrl, {
          method: candidate.method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: candidate.body ? JSON.stringify(candidate.body) : undefined,
          signal: AbortSignal.timeout(15000),
        });

        const data: any = await res.json().catch(() => null);

        if (Array.isArray(data) && data[0]?.code === 'user-incorrect-login-or-password') {
          throw new Error('Неправильный логин или пароль (ошибка авторизации ИС МПТ)');
        }

        if (res.ok && data) {
          authResponse = data;
          break;
        }

        if (res.status === 401 || res.status === 403) {
          const detail = data?.message || data?.error || 'Неверный логин или пароль';
          throw new Error(`Ошибка авторизации (${res.status}): ${detail}`);
        }

        lastError = new Error(`HTTP ${res.status}: ${data?.message || data?.error || res.statusText}`);
      } catch (err: any) {
        lastError = err;
        if (
          err.message &&
          (err.message.includes('401') || err.message.includes('Неправильный логин'))
        ) {
          throw err;
        }
      }
    }

    if (!authResponse) {
      const errMessage = lastError?.message || 'Сервер markirovka.kz не ответил на запрос авторизации';
      throw new Error(`Не удалось авторизоваться на ${this.baseUrl}: ${errMessage}`);
    }

    // Extract token from common response structures
    const token =
      authResponse.token ||
      authResponse.accessToken ||
      authResponse.access_token ||
      authResponse.clientToken ||
      (typeof authResponse === 'string' ? authResponse : null);

    if (!token) {
      throw new Error(`Сервер вернул ответ без токена: ${JSON.stringify(authResponse)}`);
    }

    // Default lifespan 10 hours if not provided
    const expiresInSeconds = authResponse.expiresIn || authResponse.expires_in || 36000;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // Save token to database if account already exists
    if (this.account.id && this.account.id !== 'temp-check') {
      await prisma.markirovkaAccount.update({
        where: { id: this.account.id },
        data: {
          token,
          tokenExpiresAt: expiresAt,
          lastCheckedAt: new Date(),
          status: 'ACTIVE',
          lastError: null,
        },
      });
    }

    this.account.token = token;
    this.account.tokenExpiresAt = expiresAt;


    return {
      token,
      expiresAt,
      rawResponse: authResponse,
    };
  }

  /**
   * Helper to execute authorized request with auto-retry on 401
   */
  private async requestWithAuth<T>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body?: any,
    queryParams?: Record<string, any>
  ): Promise<T> {
    let auth = await this.authenticate(false);

    const buildUrl = (p: string, qp?: Record<string, any>) => {
      let u = `${this.baseUrl}${p}`;
      if (qp && Object.keys(qp).length > 0) {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(qp)) {
          if (v !== undefined && v !== null) params.append(k, String(v));
        }
        const qs = params.toString();
        if (qs) u += (u.includes('?') ? '&' : '?') + qs;
      }
      return u;
    };

    const doFetch = async (authToken: string) => {
      const fullUrl = buildUrl(path, queryParams);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'clientToken': authToken,
      };
      if (this.account.omsId) {
        headers['omsId'] = this.account.omsId;
      }

      const res = await fetch(fullUrl, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000),
      });

      const data: any = await res.json().catch(() => null);

      if (!res.ok) {
        const error = new Error(`HTTP ${res.status}: ${data?.message || data?.error || res.statusText}`);
        (error as any).status = res.status;
        (error as any).data = data;
        throw error;
      }

      return data as T;
    };

    try {
      return await doFetch(auth.token);
    } catch (err: any) {
      if (err.status === 401) {
        logger.warn(`Token expired for account ${this.account.name}, refreshing...`);
        auth = await this.authenticate(true);
        return await doFetch(auth.token);
      }
      throw err;
    }
  }

  /**
   * Test connection to the account
   */
  public async testConnection(): Promise<{ success: boolean; message: string; expiresAt?: Date }> {
    try {
      const auth = await this.authenticate(true);
      return {
        success: true,
        message: `Успешное подключение к ${this.baseUrl}! Токен получен.`,
        expiresAt: auth.expiresAt,
      };
    } catch (err: any) {
      const message = err.message || 'Ошибка подключения к серверу маркировки';
      if (this.account.id && this.account.id !== 'temp-check') {
        await prisma.markirovkaAccount.update({
          where: { id: this.account.id },
          data: {
            status: 'AUTH_ERROR',
            lastError: message,
            lastCheckedAt: new Date(),
          },
        });
      }
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Auto-fetch active businessPlaceId for the account from IS MPT
   */
  public async getBusinessPlaceId(): Promise<number | string> {
    if (this.account.omsId && !isNaN(Number(this.account.omsId))) {
      return Number(this.account.omsId);
    }
    const auth = await this.authenticate(false);

    try {
      const ordersRes = await fetch(`${this.baseUrl}/api/facade/orders?gridType=own&limit=1`, {
        headers: { 'Authorization': `Bearer ${auth.token}`, 'Accept': 'application/json' },
      });
      if (ordersRes.ok) {
        const data: any = await ordersRes.json();
        const tin = data?.orderInfos?.[0]?.issuerTin;
        if (tin) {
          const contractorRes = await fetch(`${this.baseUrl}/api/v1/party/parties/contractors/${tin}`, {
            headers: { 'Authorization': `Bearer ${auth.token}`, 'Accept': 'application/json' },
          });
          const contractorData: any = await contractorRes.json().catch(() => null);
          const partyId = contractorData?.partyId || contractorData?.id;
          if (partyId) {
            const partyRes = await fetch(`${this.baseUrl}/api/v1/party/parties/${partyId}`, {
              headers: { 'Authorization': `Bearer ${auth.token}`, 'Accept': 'application/json' },
            });
            if (partyRes.ok) {
              const partyData: any = await partyRes.json();
              const bp = partyData?.partyKinds?.[0]?.businessPlaces?.find((b: any) => b.isMain) || partyData?.partyKinds?.[0]?.businessPlaces?.[0];
              if (bp?.id) return bp.id;
            }
          }
        }
      }
    } catch (e: any) {
      logger.warn(`Failed auto-discovering businessPlaceId: ${e?.message}`);
    }

    return 44;
  }

  /**
   * Helper to perform fetch with authorization and automatic token refresh on 401
   */
  public async fetchRawWithAuth(
    path: string,
    init: RequestInit = {}
  ): Promise<Response> {
    let auth = await this.authenticate(false);
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${auth.token}`);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');

    let res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (res.status === 401) {
      logger.warn(`Token 401 for account ${this.account.name}, refreshing token...`);
      auth = await this.authenticate(true);
      headers.set('Authorization', `Bearer ${auth.token}`);
      res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers,
      });
    }

    return res;
  }

  /**
   * Create an emission order in Kazakhstan IS MPT (/api/facade/orders)
   */
  public async createEmissionOrder(params: CreateOrderParams): Promise<{
    orderId: string;
    expectedCompletionTime?: string;
    raw: any;
  }> {
    const productGroup = CATEGORY_TO_OMS_EXTENSION[params.category] || 'autofluids';
    const businessPlaceId = await this.getBusinessPlaceId();

    const doc = {
      productGroup,
      releaseMethodType: 'PRIMARY',
      businessPlaceId: Number(businessPlaceId) || 44,
      poNumber: `TANBOX-${Date.now().toString().slice(-6)}`,
      products: [
        {
          gtin: params.gtin.trim(),
          quantity: Number(params.quantity),
          cisType: 'UNIT',
          serialNumberType: params.serialNumberType || 'OPERATOR',
        },
      ],
    };

    const form = new FormData();
    form.append('document', JSON.stringify(doc));

    const res = await this.fetchRawWithAuth('/api/facade/orders', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(30000),
    });

    const data: any = await res.json().catch(() => null);

    if (!res.ok) {
      const errDetail = Array.isArray(data) ? (data[0]?.code || JSON.stringify(data)) : (data?.message || data?.error || res.statusText);
      throw new Error(`Ошибка создания заказа в ИС МПТ: HTTP ${res.status}: ${errDetail}`);
    }

    const orderId = data?.orderId || data?.id;
    if (!orderId) {
      throw new Error(`ИС МПТ не вернул orderId: ${JSON.stringify(data)}`);
    }

    return {
      orderId: String(orderId),
      raw: data,
    };
  }

  /**
   * Check status of emission order in Kazakhstan IS MPT
   */
  public async getOrderStatus(orderId: string, _category?: OrderCategory): Promise<{
    status: 'READY' | 'PENDING' | 'FAILED';
    availableCodesCount?: number;
    raw: any;
  }> {
    const res = await this.fetchRawWithAuth(`/api/facade/orders/${orderId}`, {
      signal: AbortSignal.timeout(15000),
    });

    const data: any = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(`Ошибка проверки статуса заказа ${orderId}: HTTP ${res.status}`);
    }

    const statusStr = (data?.status || '').toUpperCase();
    const isReady = statusStr === 'READY' || statusStr === 'CLOSED' || statusStr === 'COMPLETED';
    const totalAvail = (data?.buffers || []).reduce((sum: number, b: any) => sum + (b.availableCodes || 0), 0);

    return {
      status: isReady ? 'READY' : statusStr === 'FAILED' ? 'FAILED' : 'PENDING',
      availableCodesCount: totalAvail,
      raw: data,
    };
  }

  /**
   * Fetch generated DataMatrix codes from Kazakhstan IS MPT
   */
  public async fetchCodes(
    orderId: string,
    gtin: string,
    quantity: number,
    _category?: OrderCategory
  ): Promise<string[]> {
    // 1. Get packId from /api/facade/codes
    let packId: string | null = null;
    try {
      const codesInfoRes = await this.fetchRawWithAuth(
        `/api/facade/codes?orderId=${orderId}&gtin=${gtin.trim()}&quantity=${quantity}`,
        { signal: AbortSignal.timeout(30000) }
      );
      if (codesInfoRes.ok) {
        const infoData: any = await codesInfoRes.json().catch(() => null);
        packId = infoData?.packId;
      }
    } catch (e: any) {
      logger.warn(`Failed getting packId via /api/facade/codes: ${e?.message}`);
    }

    // Fallback: check retry-list
    if (!packId) {
      const retryRes = await this.fetchRawWithAuth(
        `/api/facade/codes/retry-list?orderId=${orderId}`,
        { signal: AbortSignal.timeout(30000) }
      );
      if (retryRes.ok) {
        const retryData: any = await retryRes.json().catch(() => null);
        const item = (retryData?.list || []).find((l: any) => l.gtin === gtin.trim()) || retryData?.list?.[0];
        packId = item?.packId;
      }
    }

    if (!packId) {
      throw new Error(`Не удалось получить packId для выгрузки кодов заказа ${orderId}`);
    }

    // 2. Fetch DataMatrix codes via POST /api/facade/codes/print
    const printRes = await this.fetchRawWithAuth(
      '/api/facade/codes/print',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          packId,
          gtin: gtin.trim(),
          quantity: Number(quantity),
          format: 'CSV',
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!printRes.ok) {
      const errText = await printRes.text();
      throw new Error(`Ошибка выгрузки кодов из ИС МПТ: HTTP ${printRes.status}: ${errText}`);
    }

    const csvText = await printRes.text();
    const codesList = csvText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.toLowerCase().startsWith('code'));

    if (codesList.length === 0) {
      throw new Error('ИС МПТ вернул пустой список кодов');
    }

    return codesList;
  }

  /**
   * Polls order status until ready (up to timeoutMs) and fetches DataMatrix codes
   */
  public async pollAndFetchCodes(
    orderId: string,
    gtin: string,
    quantity: number,
    timeoutMs: number = 10000,
    category?: OrderCategory
  ): Promise<{ status: 'READY' | 'PENDING' | 'FAILED'; codes: string[] }> {
    const startTime = Date.now();
    let lastStatus: 'READY' | 'PENDING' | 'FAILED' = 'PENDING';

    while (Date.now() - startTime < timeoutMs) {
      try {
        const orderStatus = await this.getOrderStatus(orderId, category);
        lastStatus = orderStatus.status;

        if (orderStatus.status === 'READY') {
          // Codes are ready in buffer, fetch them
          const codes = await this.fetchCodes(orderId, gtin, quantity, category);
          return { status: 'READY', codes };
        } else if (orderStatus.status === 'FAILED') {
          return { status: 'FAILED', codes: [] };
        }
      } catch (err: any) {
        logger.warn(`Polling IS MPT order ${orderId}: ${err?.message}`);
      }

      // Wait 1.5 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Try fetching one last time before giving up
    try {
      const codes = await this.fetchCodes(orderId, gtin, quantity, category);
      if (codes && codes.length > 0) {
        return { status: 'READY', codes };
      }
    } catch {
      // Still not ready
    }

    return { status: lastStatus, codes: [] };
  }

  /**
   * Submit utilisation report (Отчет о нанесении кодов маркировки)
   */
  public async submitUtilisationReport(params: UtilisationParams): Promise<{
    reportId: string;
    status: 'ACCEPTED' | 'REJECTED' | 'SUBMITTED';
    raw: any;
  }> {
    const productGroup = CATEGORY_TO_OMS_EXTENSION[params.category] || 'autofluids';
    const businessPlaceId = params.businessPlaceId || (await this.getBusinessPlaceId());

    // In Kazakhstan IS MPT, productionDate cannot be >= server transaction time.
    // Ensure productionDate is strictly in the past (at least 2 hours ago) to avoid HTTP 400: invalid-input-parameter
    const dateCandidate = params.productionDate ? new Date(params.productionDate) : new Date(Date.now() - 2 * 3600 * 1000);
    const prodDate = dateCandidate.getTime() > Date.now() - 30 * 60 * 1000
      ? new Date(Date.now() - 2 * 3600 * 1000)
      : dateCandidate;

    const hasExpiration = ['OILS', 'MEDICINE', 'WATER', 'BEER', 'DIETARY_SUPPLEMENTS'].includes(params.category);
    let expDateIso: string | undefined = undefined;
    if (params.expirationDate) {
      expDateIso = new Date(params.expirationDate).toISOString();
    } else if (hasExpiration) {
      expDateIso = new Date(prodDate.getTime() + 3 * 365 * 24 * 3600 * 1000).toISOString();
    }

    const cleanCodes = params.codes
      .map((c) => c.replace(/[\r\n]/g, '').trim())
      .filter((c) => c.length > 0);

    const releaseType = params.releaseType || 'PRODUCTION';
    let manufacturerCountry = params.manufacturerCountry || 'KZ';
    if (releaseType === 'PRODUCTION') {
      manufacturerCountry = 'KZ';
    } else if (releaseType === 'IMPORT' && manufacturerCountry === 'KZ') {
      manufacturerCountry = 'RU';
    }

    const doc: any = {
      productGroup,
      businessPlaceId: Number(businessPlaceId) || 44,
      productionDate: prodDate.toISOString(),
      manufacturerCountry,
      releaseType,
      sntins: cleanCodes,
    };

    if (expDateIso) {
      doc.expirationDate = expDateIso;
    }
    // Note: doc.series is intentionally not passed to IS MPT facade API
    // because IS MPT СУЗ returns HTTP 400 invalid-format if series is in the payload.
    // It is preserved in the local database markirovkaUtilisationReport.reportData.

    const form = new FormData();
    form.append('document', JSON.stringify(doc));

    const res = await this.fetchRawWithAuth('/api/facade/reports/utilisation', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(30000),
    });

    const data: any = await res.json().catch(() => null);

    if (!res.ok) {
      let errDetail = res.statusText;
      if (Array.isArray(data)) {
        errDetail = data
          .map((d: any) => `${d.code || 'error'}${d.context?.parameter ? ` (параметр: ${d.context.parameter})` : ''}`)
          .join(', ');
      } else if (data?.message || data?.error) {
        errDetail = data.message || data.error;
      }
      throw new Error(`Ошибка отправки отчета в ИС МПТ: HTTP ${res.status}: ${errDetail}`);
    }

    const reportId = data?.reportId || data?.id || data?.documentId;
    if (!reportId) {
      throw new Error(`ИС МПТ не вернул идентификатор отчета: ${JSON.stringify(data)}`);
    }

    return {
      reportId: String(reportId),
      status: 'ACCEPTED',
      raw: data,
    };
  }

  /**
   * Generates CSV string for manual upload / export of utilisation report
   */
  public static generateUtilisationCsv(codes: string[], gtin?: string): string {
    const lines = ['code,gtin,appliedDate'];
    const now = new Date().toISOString();
    for (const code of codes) {
      const cleanCode = code.replace(/[\r\n",]/g, '').trim();
      const codeGtin = gtin || (cleanCode.startsWith('01') ? cleanCode.slice(2, 16) : '');
      lines.push(`"${cleanCode}","${codeGtin}","${now}"`);
    }
    return lines.join('\n');
  }

  /**
   * Returns base URL for Kazakhstan True-API gateway
   */
  public getTrueApiBaseUrl(): string {
    if (this.account.environment === MarkirovkaEnvironment.TEST) {
      return 'https://stage.ismet.kz/api/v3/true-api';
    }
    return 'https://elk.prod.markirovka.ismet.kz/api/v3/true-api';
  }

  /**
   * 1. Register Import (Ввод в оборот / Импорт товаров) via ICOM REST API xTrace
   * POST /public/api/v1/doc/import
   */
  public async sendIcomImportDocument(params: {
    businessPlaceId?: number;
    codes: string[];
    customsDeclaration: {
      date: string;
      number: string;
      authorityCode?: string;
    };
    exportCountry?: string;
    rawDocString?: string;
    signature?: string;
  }): Promise<{
    success: boolean;
    httpStatus: number;
    url: string;
    documentId?: string;
    response: any;
    error?: string;
  }> {
    let auth = await this.authenticate(false);
    const targetUrl = `${this.baseUrl}/public/api/v1/doc/import`;

    let base64Body: string;
    const cleanCodes = params.codes.map((c) => extractIdentificationCode(c)).filter(Boolean);
    if (params.rawDocString) {
      base64Body = Buffer.from(params.rawDocString, 'utf-8').toString('base64');
    } else {
      const docObj = {
        businessPlaceId: Number(params.businessPlaceId) || 44,
        codes: cleanCodes,
        customsDeclaration: {
          ...(params.customsDeclaration.authorityCode ? { authorityCode: params.customsDeclaration.authorityCode } : {}),
          date: params.customsDeclaration.date,
          number: params.customsDeclaration.number,
        },
        exportCountry: params.exportCountry || 'CN',
      };
      const sortedDoc = sortKeysAlphabetically(docObj);
      base64Body = Buffer.from(JSON.stringify(sortedDoc), 'utf-8').toString('base64');
    }

    const requestBody = {
      documentBody: base64Body,
      signature: params.signature || '',
    };

    logger.info(`[ICOM REST API] Submitting import document to ${targetUrl}...`);

    try {
      let res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000),
      });

      let responseText = await res.text();
      let responseData: any = null;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      // If token expired / inactive, refresh token and retry once
      if (res.status === 401 || responseData?.context?._cause === 'inactive-token') {
        logger.info(`[ICOM REST API] Token inactive or expired, refreshing token and retrying...`);
        auth = await this.authenticate(true);
        res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(30000),
        });
        responseText = await res.text();
        try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }
      }

      const documentId = responseData?.documentId;
      logger.info(`[ICOM REST API] Import HTTP ${res.status}, documentId=${documentId}`);

      return {
        success: res.ok,
        httpStatus: res.status,
        url: targetUrl,
        documentId,
        response: responseData,
        error: !res.ok ? (responseData?.context?._cause || responseData?.code || responseData?.error || `HTTP ${res.status}`) : undefined,
      };
    } catch (err: any) {
      logger.error(`[ICOM REST API] Network failure calling ${targetUrl}:`, err);
      return {
        success: false,
        httpStatus: 0,
        url: targetUrl,
        response: { error: err.message },
        error: `Сетевая ошибка обращения к ИС МПТ: ${err.message}`,
      };
    }
  }

  /**
   * 2. Register Aggregation via ICOM REST API xTrace
   * POST /public/api/v1/doc/aggregation
   */
  public async sendIcomAggregationDocument(params: {
    businessPlaceId?: number;
    unitSerialNumber: string;
    codes: string[];
    signature?: string;
  }): Promise<{
    success: boolean;
    httpStatus: number;
    url: string;
    documentId?: string;
    response: any;
    error?: string;
  }> {
    let auth = await this.authenticate(false);
    const targetUrl = `${this.baseUrl}/public/api/v1/doc/aggregation`;

    const formattedSscc = normalizeSscc18(params.unitSerialNumber);
    const cleanCodes = params.codes.map((c) => extractIdentificationCode(c)).filter(Boolean);

    const docObj = {
      businessPlaceId: Number(params.businessPlaceId) || 44,
      documentDate: new Date().toISOString(),
      aggregationUnits: [
        {
          shouldBeUnbundled: true,
          aggregationItemsCount: cleanCodes.length,
          aggregationUnitCapacity: cleanCodes.length,
          codes: cleanCodes,
          unitSerialNumber: formattedSscc,
        },
      ],
    };

    const sortedDoc = sortKeysAlphabetically(docObj);
    const base64Body = Buffer.from(JSON.stringify(sortedDoc), 'utf-8').toString('base64');

    const requestBody = {
      documentBody: base64Body,
      signature: params.signature || '',
    };

    try {
      let res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000),
      });

      let responseText = await res.text();
      let responseData: any = null;
      try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }

      if (res.status === 401 || responseData?.context?._cause === 'inactive-token') {
        auth = await this.authenticate(true);
        res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(30000),
        });
        responseText = await res.text();
        try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }
      }

      return {
        success: res.ok,
        httpStatus: res.status,
        url: targetUrl,
        documentId: responseData?.documentId,
        response: responseData,
        error: !res.ok ? (responseData?.context?._cause || responseData?.code || responseData?.error || `HTTP ${res.status}`) : undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        httpStatus: 0,
        url: targetUrl,
        response: { error: err.message },
        error: err.message,
      };
    }
  }

  /**
   * 3. Register Disaggregation via ICOM REST API xTrace
   * POST /public/api/v1/doc/transport-code-disaggregation
   */
  public async sendIcomDisaggregationDocument(params: {
    codes: string[];
  }): Promise<{
    success: boolean;
    httpStatus: number;
    url: string;
    documentId?: string;
    response: any;
    error?: string;
  }> {
    let auth = await this.authenticate(false);
    const targetUrl = `${this.baseUrl}/public/api/v1/doc/transport-code-disaggregation`;

    const formattedCodes = params.codes.map((c) => normalizeSscc18(c));

    const docObj = {
      businessDatetime: new Date().toISOString(),
      codes: formattedCodes,
    };

    const sortedDoc = sortKeysAlphabetically(docObj);
    const base64Body = Buffer.from(JSON.stringify(sortedDoc), 'utf-8').toString('base64');

    try {
      let res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ documentBody: base64Body }),
        signal: AbortSignal.timeout(30000),
      });

      let responseText = await res.text();
      let responseData: any = null;
      try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }

      if (res.status === 401 || responseData?.context?._cause === 'inactive-token') {
        auth = await this.authenticate(true);
        res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ documentBody: base64Body }),
          signal: AbortSignal.timeout(30000),
        });
        responseText = await res.text();
        try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }
      }

      return {
        success: res.ok,
        httpStatus: res.status,
        url: targetUrl,
        documentId: responseData?.documentId,
        response: responseData,
        error: !res.ok ? (responseData?.context?._cause || responseData?.code || responseData?.error || `HTTP ${res.status}`) : undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        httpStatus: 0,
        url: targetUrl,
        response: { error: err.message },
        error: err.message,
      };
    }
  }

  /**
   * 4. Register Withdrawal (Вывод из оборота) via ICOM REST API xTrace
   * POST /public/api/v1/doc/withdrawal
   */
  public async sendIcomWithdrawalDocument(params: {
    businessPlaceId?: number;
    withdrawalType?: 'WITHDRAWAL' | 'WRITE_OFF';
    withdrawalReason: string;
    codes: string[];
    primaryDocument?: { type?: string; date?: string; number?: string };
    signature?: string;
  }): Promise<{
    success: boolean;
    httpStatus: number;
    url: string;
    documentId?: string;
    response: any;
    error?: string;
  }> {
    let auth = await this.authenticate(false);
    const targetUrl = `${this.baseUrl}/public/api/v1/doc/withdrawal`;

    const withdrawalType = params.withdrawalType || (params.withdrawalReason === 'DAMAGE' ? 'WRITE_OFF' : 'WITHDRAWAL');
    const cleanCodes = params.codes.map((c) => extractIdentificationCode(c)).filter(Boolean);

    const docObj = {
      businessPlaceId: Number(params.businessPlaceId) || 44,
      childrenWriteOff: false,
      codes: cleanCodes.map((c) => ({ code: c })),
      primaryDocument: {
        date: params.primaryDocument?.date || new Date().toISOString().slice(0, 10),
        number: params.primaryDocument?.number || 'DOC-001',
        type: params.primaryDocument?.type || '',
      },
      withdrawPartialQuantity: false,
      withdrawalDate: new Date().toISOString(),
      withdrawalReason: params.withdrawalReason || 'OTHER',
      withdrawalType,
    };

    const sortedDoc = sortKeysAlphabetically(docObj);
    const base64Body = Buffer.from(JSON.stringify(sortedDoc), 'utf-8').toString('base64');

    const requestBody = {
      documentBody: base64Body,
      signature: params.signature || '',
    };

    try {
      let res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000),
      });

      let responseText = await res.text();
      let responseData: any = null;
      try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }

      if (res.status === 401 || responseData?.context?._cause === 'inactive-token') {
        auth = await this.authenticate(true);
        res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(30000),
        });
        responseText = await res.text();
        try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }
      }

      return {
        success: res.ok,
        httpStatus: res.status,
        url: targetUrl,
        documentId: responseData?.documentId,
        response: responseData,
        error: !res.ok ? (responseData?.context?._cause || responseData?.code || responseData?.error || `HTTP ${res.status}`) : undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        httpStatus: 0,
        url: targetUrl,
        response: { error: err.message },
        error: err.message,
      };
    }
  }

  /**
   * 5. Validate Codes via ICOM REST API xTrace
   * POST /public/api/cod/public/codes
   */
  public async validateCodesIcom(codes: string[]): Promise<{
    success: boolean;
    httpStatus: number;
    url: string;
    results: any[];
    raw: any;
  }> {
    let auth = await this.authenticate(false);
    const targetUrl = `${this.baseUrl}/public/api/cod/public/codes`;

    const cleanCodes = codes.map((c) => extractIdentificationCode(c)).filter(Boolean);

    try {
      let res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ codes: cleanCodes }),
        signal: AbortSignal.timeout(20000),
      });

      let data: any = await res.json().catch(async () => ({ raw: await res.text() }));

      if (res.status === 401 || data?.context?._cause === 'inactive-token') {
        auth = await this.authenticate(true);
        res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ codes: cleanCodes }),
          signal: AbortSignal.timeout(20000),
        });
        data = await res.json().catch(async () => ({ raw: await res.text() }));
      }

      const results = Array.isArray(data) ? data : (data?.codes || []);

      return {
        success: res.ok,
        httpStatus: res.status,
        url: targetUrl,
        results,
        raw: data,
      };
    } catch (err: any) {
      return {
        success: false,
        httpStatus: 0,
        url: targetUrl,
        results: [],
        raw: { error: err.message },
      };
    }
  }

  /**
   * 6. Check Document Status in Storage
   * GET /public/api/v1/doc/storage/docs/:documentId
   */
  public async getIcomDocumentStatus(documentId: string): Promise<any> {
    let auth = await this.authenticate(false);
    const targetUrl = `${this.baseUrl}/public/api/v1/doc/storage/docs/${documentId}`;
    let res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 401) {
      auth = await this.authenticate(true);
      res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });
    }
    return res.json().catch(() => null);
  }

  /**
   * Get processed codes from document storage
   * GET /public/api/v1/doc/storage/docs/:documentId/codes
   */
  public async getIcomDocumentCodes(documentId: string, limit: number = 500): Promise<any[]> {
    let auth = await this.authenticate(false);
    const targetUrl = `${this.baseUrl}/public/api/v1/doc/storage/docs/${documentId}/codes?limit=${limit}`;
    let res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 401) {
      auth = await this.authenticate(true);
      res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });
    }
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : (data?.codes || []);
  }

  /**
   * Get validation errors for document from storage
   * GET /public/api/v1/doc/storage/errors/:documentId
   */
  public async getIcomDocumentErrors(documentId: string): Promise<any> {
    let auth = await this.authenticate(false);
    const targetUrl = `${this.baseUrl}/public/api/v1/doc/storage/errors/${documentId}`;
    let res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 401) {
      auth = await this.authenticate(true);
      res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });
    }
    return res.json().catch(() => null);
  }

  /**
   * Search product in National Catalog by GTIN
   * GET /public/api/v1/product-registry/product?productGroup=...&gtin=...
   */
  public async searchProductByGtin(gtin: string, productGroup?: string): Promise<any> {
    let auth = await this.authenticate(false);
    const cleanGtin = gtin.trim();

    // Check requested group first, then fallback to other common categories if not found
    const candidateGroups = productGroup
      ? [productGroup, 'autofluids', 'shoes', 'clothes', 'tobacco', 'pharma', 'water'].filter(
          (v, i, a) => a.indexOf(v) === i
        )
      : ['autofluids', 'shoes', 'clothes', 'tobacco', 'pharma', 'water'];

    let foundProduct: any = null;
    let lastStatus = 404;

    for (const pg of candidateGroups) {
      const targetUrl = `${this.baseUrl}/public/api/v1/product-registry/product?productGroup=${encodeURIComponent(pg)}&gtin=${encodeURIComponent(cleanGtin)}`;
      let res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }).catch(() => null);

      if (res && res.status === 401) {
        auth = await this.authenticate(true);
        res = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        }).catch(() => null);
      }

      if (res) {
        lastStatus = res.status;
        if (res.ok) {
          const data: any = await res.json().catch(() => null);
          if (Array.isArray(data) && data.length > 0) {
            foundProduct = data[0];
            break;
          } else if (data && !Array.isArray(data) && (data.gtin || data.id)) {
            foundProduct = data;
            break;
          }
        }
      }
    }

    return {
      success: !!foundProduct,
      httpStatus: foundProduct ? 200 : lastStatus,
      product: foundProduct,
    };
  }

  /**
   * Check participant registration status by TIN (ИИН/БИН)
   * GET /public/api/v1/party/parties/:tin/status
   */
  public async checkPartyStatus(tin: string): Promise<any> {
    let auth = await this.authenticate(false);
    const cleanTin = tin.trim();
    const targetUrl = `${this.baseUrl}/public/api/v1/party/parties/${encodeURIComponent(cleanTin)}/status`;

    let res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (res.status === 401) {
      auth = await this.authenticate(true);
      res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });
    }

    const data: any = await res.json().catch(() => null);
    return {
      success: res.ok,
      httpStatus: res.status,
      party: data,
    };
  }

  /**
   * 8. Register Return to Turnover (Возврат в оборот) via ICOM REST API xTrace
   * POST /public/api/v1/doc/return-to-turnover
   */
  public async sendIcomReturnToTurnoverDocument(params: {
    businessPlaceId?: number;
    businessDate?: string;
    returnReason: string;
    primaryDocument?: { type?: string; date?: string; number?: string };
    codes: string[];
    rawDocString?: string;
    signature?: string;
  }): Promise<{
    success: boolean;
    httpStatus: number;
    url: string;
    documentId?: string;
    response: any;
    error?: string;
  }> {
    let auth = await this.authenticate(false);
    const targetUrl = `${this.baseUrl}/public/api/v1/doc/return-to-turnover`;

    let base64Body: string;
    const cleanCodes = params.codes.map((c) => extractIdentificationCode(c)).filter(Boolean);
    if (params.rawDocString) {
      base64Body = Buffer.from(params.rawDocString, 'utf-8').toString('base64');
    } else {
      const docObj = {
        businessDate: params.businessDate || new Date().toISOString(),
        businessPlaceId: Number(params.businessPlaceId) || 44,
        codes: cleanCodes.map((c) => ({ code: c })),
        primaryDocument: {
          date: params.primaryDocument?.date || new Date().toISOString().slice(0, 10),
          number: params.primaryDocument?.number || 'DOC-001',
          type: params.primaryDocument?.type || 'Приказ',
        },
        returnReason: params.returnReason || 'RETAIL_RETURN',
      };
      const sortedDoc = sortKeysAlphabetically(docObj);
      base64Body = Buffer.from(JSON.stringify(sortedDoc), 'utf-8').toString('base64');
    }

    const requestBody = {
      documentBody: base64Body,
      signature: params.signature || '',
    };

    try {
      let res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000),
      });

      let responseText = await res.text();
      let responseData: any = null;
      try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }

      if (res.status === 401 || responseData?.context?._cause === 'inactive-token') {
        auth = await this.authenticate(true);
        res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(30000),
        });
        responseText = await res.text();
        try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }
      }

      return {
        success: res.ok,
        httpStatus: res.status,
        url: targetUrl,
        documentId: responseData?.documentId,
        response: responseData,
        error: !res.ok ? (responseData?.context?._cause || responseData?.code || responseData?.error || `HTTP ${res.status}`) : undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        httpStatus: 0,
        url: targetUrl,
        response: { error: err.message },
        error: err.message,
      };
    }
  }

  /**
   * 7. Register Correction (Корректировка сведений о кодах маркировки) via ICOM REST API xTrace
   * POST /public/api/v1/doc/correction
   */
  public async sendIcomCorrectionDocument(params: {
    codes: string[];
    updatedFields?: {
      expirationDatetime?: string;
      productionDatetime?: string;
      manufacturerCountry?: string;
      seriesNumber?: string;
    };
    rawDocString?: string;
    signature?: string;
  }): Promise<{
    success: boolean;
    httpStatus: number;
    url: string;
    documentId?: string;
    response: any;
    error?: string;
  }> {
    let auth = await this.authenticate(false);
    const targetUrl = `${this.baseUrl}/public/api/v1/doc/correction`;

    let base64Body: string;
    const cleanCodes = params.codes.map((c) => extractIdentificationCode(c)).filter(Boolean);
    if (params.rawDocString) {
      base64Body = Buffer.from(params.rawDocString, 'utf-8').toString('base64');
    } else {
      const docObj = {
        businessDatetime: new Date().toISOString(),
        codes: cleanCodes,
        updatedFields: params.updatedFields || {},
      };
      const sortedDoc = sortKeysAlphabetically(docObj);
      base64Body = Buffer.from(JSON.stringify(sortedDoc), 'utf-8').toString('base64');
    }

    const requestBody = {
      documentBody: base64Body,
      signature: params.signature || '',
    };

    try {
      let res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000),
      });

      let responseText = await res.text();
      let responseData: any = null;
      try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }

      if (res.status === 401 || responseData?.context?._cause === 'inactive-token') {
        auth = await this.authenticate(true);
        res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(30000),
        });
        responseText = await res.text();
        try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }
      }

      return {
        success: res.ok,
        httpStatus: res.status,
        url: targetUrl,
        documentId: responseData?.documentId,
        response: responseData,
        error: !res.ok ? (responseData?.context?._cause || responseData?.code || responseData?.error || `HTTP ${res.status}`) : undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        httpStatus: 0,
        url: targetUrl,
        response: { error: err.message },
        error: err.message,
      };
    }
  }

  // Deprecated True-API methods kept as backward compatibility wrappers
  public async sendTrueApiDocument(params: any): Promise<any> {
    return this.sendIcomImportDocument({
      codes: params.documentPayload?.products?.map((p: any) => p.cis) || [],
      customsDeclaration: {
        date: params.documentPayload?.declaration_date || new Date().toISOString(),
        number: params.documentPayload?.declaration_number || 'IMP-001',
      },
      signature: params.signature,
    });
  }

  public async validateCisesTrueApi(codes: string[]): Promise<any> {
    return this.validateCodesIcom(codes);
  }

  /**
   * Request True-API authentication challenge (uuid & data)
   */
  public async getTrueApiChallenge(): Promise<{ uuid: string; data: string }> {
    const trueApiBase = this.getTrueApiBaseUrl();
    const res = await fetch(`${trueApiBase}/auth/key`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Ошибка получения auth/key от ${trueApiBase}`);
    }
    const data: any = await res.json();
    return { uuid: data.uuid, data: data.data };
  }

  /**
   * Exchange signed challenge for True-API JWT session token
   */
  public async signInTrueApiWithEds(uuid: string, signedData: string): Promise<string> {
    const trueApiBase = this.getTrueApiBaseUrl();
    const cleanSig = signedData.trim().replace(/[\r\n]/g, '');

    logger.info(`[IS MPT True-API] Submitting simpleSignIn to ${trueApiBase}/auth/simpleSignIn (uuid=${uuid}, sigLen=${cleanSig.length})`);

    const res = await fetch(`${trueApiBase}/auth/simpleSignIn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ uuid, data: cleanSig }),
      signal: AbortSignal.timeout(20000),
    });

    const responseText = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    logger.info(`[IS MPT True-API] simpleSignIn HTTP ${res.status}: ${responseText.slice(0, 300)}`);

    if (!res.ok) {
      const err =
        data?.error_message ||
        data?.error_description ||
        data?.message ||
        data?.error ||
        (data?.raw ? data.raw.slice(0, 150) : '') ||
        `HTTP ${res.status}`;
      throw new Error(`Ошибка авторизации в True-API: ${err}`);
    }

    const token = data.token || data.accessToken || data.value || data;
    if (this.account.id) {
      await prisma.markirovkaAccount.update({
        where: { id: this.account.id },
        data: {
          trueApiToken: String(token),
          trueApiExpiresAt: new Date(Date.now() + 10 * 3600 * 1000),
        },
      });
      (this.account as any).trueApiToken = String(token);
    }
    return String(token);
  }
}

