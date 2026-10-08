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
  productionDate?: Date;
  factoryName?: string;
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

    // Potential endpoints supported by Qazmarka / True API / OMS Cloud
    const candidateEndpoints = [
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
   * Create an emission order in Kazakhstan IS MPT (/api/facade/orders)
   */
  public async createEmissionOrder(params: CreateOrderParams): Promise<{
    orderId: string;
    expectedCompletionTime?: string;
    raw: any;
  }> {
    const auth = await this.authenticate(false);
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

    const res = await fetch(`${this.baseUrl}/api/facade/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.token}`,
      },
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
    const auth = await this.authenticate(false);
    const res = await fetch(`${this.baseUrl}/api/facade/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Accept': 'application/json',
      },
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
    const auth = await this.authenticate(false);

    // 1. Get packId from /api/facade/codes
    let packId: string | null = null;
    try {
      const codesInfoRes = await fetch(
        `${this.baseUrl}/api/facade/codes?orderId=${orderId}&gtin=${gtin.trim()}&quantity=${quantity}`,
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(30000),
        }
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
      const retryRes = await fetch(`${this.baseUrl}/api/facade/codes/retry-list?orderId=${orderId}`, {
        headers: { 'Authorization': `Bearer ${auth.token}` },
      });
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
    const printRes = await fetch(`${this.baseUrl}/api/facade/codes/print`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.token}`,
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
    });

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
   * Submit utilisation report (Отчет о нанесении кодов маркировки)
   */
  public async submitUtilisationReport(params: UtilisationParams): Promise<{
    reportId: string;
    status: 'ACCEPTED' | 'REJECTED' | 'SUBMITTED';
    raw: any;
  }> {
    const auth = await this.authenticate(false);
    const productGroup = CATEGORY_TO_OMS_EXTENSION[params.category] || 'autofluids';
    const businessPlaceId = await this.getBusinessPlaceId();
    const now = params.productionDate || new Date();

    const doc = {
      productGroup,
      businessPlaceId: Number(businessPlaceId) || 44,
      productionDate: now.toISOString(),
      expirationDate: new Date(now.getTime() + 3 * 365 * 24 * 3600 * 1000).toISOString(),
      manufacturerCountry: 'KZ',
      releaseType: 'PRODUCTION',
      sntins: params.codes,
    };

    const form = new FormData();
    form.append('document', JSON.stringify(doc));

    const res = await fetch(`${this.baseUrl}/api/facade/reports/utilisation`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${auth.token}` },
      body: form,
      signal: AbortSignal.timeout(30000),
    });

    const data: any = await res.json().catch(() => null);

    if (!res.ok) {
      const errDetail = Array.isArray(data) ? (data[0]?.code || JSON.stringify(data)) : (data?.message || data?.error || res.statusText);
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
}
