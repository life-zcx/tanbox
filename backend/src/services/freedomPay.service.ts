import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface InitPaymentOptions {
  paymentNumber: string;
  amount: number | string;
  description: string;
  userEmail?: string;
  userPhone?: string;
  successUrl?: string;
  failureUrl?: string;
  checkUrl?: string;
  resultUrl?: string;
  metadata?: Record<string, any>;
}

export interface InitPaymentResult {
  success: boolean;
  redirectUrl?: string;
  paymentId?: string;
  error?: string;
  rawResponse?: string;
}

export class FreedomPayService {
  private get merchantId(): string {
    return env.FREEDOM_PAY_MERCHANT_ID;
  }

  private get secretKey(): string {
    return env.FREEDOM_PAY_SECRET_KEY;
  }

  private get apiUrl(): string {
    return env.FREEDOM_PAY_API_URL;
  }

  private get isTestMode(): string {
    return env.FREEDOM_PAY_TEST_MODE;
  }

  /**
   * Generates Freedom Pay / Paybox MD5 signature
   * Formula: md5(scriptName;val1;val2;...;secretKey) with alphabetical parameter keys
   */
  public generatePgSig(scriptName: string, params: Record<string, any>, customSecret?: string): string {
    const secret = customSecret || this.secretKey;
    const cleanParams: Record<string, string> = {};

    for (const [key, val] of Object.entries(params)) {
      if (key === 'pg_sig' || val === undefined || val === null) {
        continue;
      }
      if (typeof val === 'object') {
        // Flatten or serialize object if needed
        cleanParams[key] = JSON.stringify(val);
      } else {
        cleanParams[key] = String(val);
      }
    }

    const sortedKeys = Object.keys(cleanParams).sort();
    const valuesToConcat: string[] = [scriptName];

    for (const key of sortedKeys) {
      valuesToConcat.push(cleanParams[key]);
    }

    valuesToConcat.push(secret);

    const stringToSign = valuesToConcat.join(';');
    return crypto.createHash('md5').update(stringToSign, 'utf8').digest('hex');
  }

  /**
   * Verifies incoming webhook signature against one or multiple candidate script names
   * (e.g. 'result', 'result.php')
   */
  public verifyPgSig(candidateScripts: string | string[], params: Record<string, any>, incomingSig: string): boolean {
    if (!incomingSig) return false;
    const scripts = Array.isArray(candidateScripts) ? candidateScripts : [candidateScripts];
    const normalizedIncoming = incomingSig.trim().toLowerCase();

    for (const script of scripts) {
      const calculated = this.generatePgSig(script, params, this.secretKey).toLowerCase();
      if (calculated === normalizedIncoming) {
        return true;
      }
    }
    return false;
  }

  /**
   * Simple helper to extract tag values from XML responses without external libraries
   */
  private extractXmlTag(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'is');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Initializes payment transaction via Freedom Pay init_payment.php
   */
  public async initPayment(options: InitPaymentOptions): Promise<InitPaymentResult> {
    const salt = crypto.randomBytes(8).toString('hex');
    const scriptName = 'init_payment.php';

    // Format amount to 2 decimal places or clean string
    const formattedAmount = Number(options.amount).toFixed(2);

    const defaultSuccessUrl = `${env.LK_URL}/orders?payment=success&paymentNumber=${encodeURIComponent(options.paymentNumber)}`;
    const defaultFailureUrl = `${env.LK_URL}/orders?payment=failed&paymentNumber=${encodeURIComponent(options.paymentNumber)}`;
    const defaultCheckUrl = `${env.API_URL}/api/payments/freedom/check`;
    const defaultResultUrl = `${env.API_URL}/api/payments/freedom/result`;

    const requestParams: Record<string, string> = {
      pg_merchant_id: this.merchantId,
      pg_order_id: options.paymentNumber,
      pg_amount: formattedAmount,
      pg_currency: 'KZT',
      pg_description: options.description,
      pg_salt: salt,
      pg_testing_mode: this.isTestMode,
      pg_success_url: options.successUrl || defaultSuccessUrl,
      pg_failure_url: options.failureUrl || defaultFailureUrl,
      pg_check_url: options.checkUrl || defaultCheckUrl,
      pg_result_url: options.resultUrl || defaultResultUrl,
      pg_request_method: 'POST',
      pg_language: 'ru',
    };

    if (options.userEmail) {
      requestParams.pg_user_email = options.userEmail;
      requestParams.pg_user_contact_email = options.userEmail;
    }
    if (options.userPhone) {
      requestParams.pg_user_phone = options.userPhone.replace(/[^\d+]/g, '');
    }

    const pgSig = this.generatePgSig(scriptName, requestParams);
    requestParams.pg_sig = pgSig;

    const endpoint = `${this.apiUrl}/init_payment.php`;

    try {
      logger.info(`[FreedomPay] Initializing payment ${options.paymentNumber} for amount ${formattedAmount} KZT...`);

      const bodyData = new URLSearchParams(requestParams).toString();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyData,
      });

      const rawXml = await response.text();
      logger.info(`[FreedomPay] Response for ${options.paymentNumber}: ${rawXml.slice(0, 300)}`);

      const status = this.extractXmlTag(rawXml, 'pg_status');
      const redirectUrl = this.extractXmlTag(rawXml, 'pg_redirect_url');
      const paymentId = this.extractXmlTag(rawXml, 'pg_payment_id');
      const errorDesc = this.extractXmlTag(rawXml, 'pg_error_description') || this.extractXmlTag(rawXml, 'pg_description');

      if (status === 'ok' && redirectUrl) {
        return {
          success: true,
          redirectUrl,
          paymentId: paymentId || undefined,
          rawResponse: rawXml,
        };
      }

      return {
        success: false,
        error: errorDesc || 'Не удалось получить ссылку на оплату от платежного шлюза Freedom Pay',
        rawResponse: rawXml,
      };
    } catch (err: any) {
      logger.error(`[FreedomPay] Network error initializing payment: ${err.message}`, { error: err });
      return {
        success: false,
        error: `Ошибка соединения с платежным шлюзом: ${err.message}`,
      };
    }
  }

  /**
   * Builds signed XML response for Freedom Pay webhooks (check & result)
   */
  public buildXmlResponse(
    scriptName: string,
    status: 'ok' | 'rejected' | 'error',
    description: string = ''
  ): string {
    const salt = crypto.randomBytes(8).toString('hex');
    const responseParams: Record<string, string> = {
      pg_salt: salt,
      pg_status: status,
      pg_description: description,
    };

    const sig = this.generatePgSig(scriptName, responseParams);

    const safeDesc = description
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `<?xml version="1.0" encoding="utf-8"?>
<response>
    <pg_salt>${salt}</pg_salt>
    <pg_status>${status}</pg_status>
    <pg_description>${safeDesc}</pg_description>
    <pg_sig>${sig}</pg_sig>
</response>`;
  }
}

export const freedomPayService = new FreedomPayService();
