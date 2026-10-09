/**
 * NCALayer WebSocket Client Service for Kazakhstan EDS / ЭЦП (НУЦ РК)
 * Protocol: wss://127.0.0.1:13579
 */

export class NCALayerService {
  private static WS_URL = 'wss://127.0.0.1:13579';

  /**
   * Quick non-blocking check if NCALayer WebSocket is open and accepting connections
   */
  public static async isNCALayerRunning(timeoutMs: number = 2000): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(this.WS_URL);
        const timer = setTimeout(() => {
          try {
            ws.close();
          } catch {}
          resolve(false);
        }, timeoutMs);

        ws.onopen = () => {
          clearTimeout(timer);
          try {
            ws.close();
          } catch {}
          resolve(true);
        };

        ws.onerror = () => {
          clearTimeout(timer);
          resolve(false);
        };
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Request detached CMS signature for given raw string or JSON data
   * @param rawData Plain text / JSON document string to sign
   * @param storageType 'PKCS12' (file on disk) or 'KAZTOKEN'
   * @param keyType 'SIGNATURE' (for document signing)
   */
  public static async signData(
    rawData: string,
    storageType: string = 'PKCS12',
    keyType: string = 'SIGNATURE',
    attachContent: boolean = false
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    return new Promise((resolve) => {
      let ws: WebSocket;
      try {
        ws = new WebSocket(this.WS_URL);
      } catch (err: any) {
        return resolve({
          success: false,
          error: 'Не удалось подключиться к NCALayer. Убедитесь, что приложение NCALayer запущено на вашем компьютере.',
        });
      }

      let isFinished = false;

      const finish = (result: { success: boolean; signature?: string; error?: string }) => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timer);
        try {
          ws.close();
        } catch {}
        resolve(result);
      };

      const timer = setTimeout(() => {
        finish({
          success: false,
          error: 'Таймаут ожидания ответа от NCALayer (прошло более 3 минут).',
        });
      }, 180000); // 3 minutes for user to select file and type password

      ws.onopen = () => {
        try {
          // Standard safe UTF-8 to Base64 conversion
          const bytes = new TextEncoder().encode(rawData);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Data = btoa(binary);

          // Official NCALayer commonUtils request:
          // args: [storageName, keyType, base64Data, attachContent]
          const request = {
            module: 'kz.gov.pki.knca.commonUtils',
            method: 'createCMSSignatureFromBase64',
            args: [storageType || 'PKCS12', keyType || 'SIGNATURE', base64Data, Boolean(attachContent)],
          };

          console.log('[NCALayer] Sending request (attachContent=' + Boolean(attachContent) + '):', request);
          ws.send(JSON.stringify(request));
        } catch (err: any) {
          finish({ success: false, error: `Ошибка подготовки данных: ${err.message}` });
        }
      };

      ws.onmessage = (event) => {
        try {
          const resp: any = JSON.parse(event.data);
          console.log('[NCALayer] Received WebSocket message:', resp);

          // 1. Check if signature payload is present
          let signature: string | null = null;
          if (typeof resp.responseObject === 'string' && resp.responseObject.length > 20) {
            signature = resp.responseObject;
          } else if (resp.responseObject?.signature && typeof resp.responseObject.signature === 'string') {
            signature = resp.responseObject.signature;
          } else if (typeof resp.result === 'string' && resp.result.length > 20) {
            signature = resp.result;
          }

          if (signature) {
            console.log('[NCALayer] Signature successfully received! Length:', signature.length);
            finish({
              success: true,
              signature,
            });
            return;
          }

          // 2. Check for explicit cancellation
          const errMsg = resp.message || resp.error || (resp.errorCode ? `Код ${resp.errorCode}` : '');
          const isCancelled =
            typeof errMsg === 'string' &&
            (errMsg.toLowerCase().includes('canceled') ||
              errMsg.toLowerCase().includes('cancelled') ||
              errMsg.toLowerCase().includes('отменен') ||
              errMsg.toLowerCase().includes('action canceled'));

          if (isCancelled) {
            finish({
              success: false,
              error: 'Подписание отменено пользователем.',
            });
            return;
          }

          // 3. Check for explicit error codes
          const hasExplicitError =
            resp.code === '500' ||
            resp.code === 500 ||
            (resp.errorCode !== undefined &&
              resp.errorCode !== null &&
              resp.errorCode !== '0' &&
              resp.errorCode !== 0 &&
              resp.errorCode !== 'NONE') ||
            (resp.result === false && Boolean(errMsg));

          if (hasExplicitError) {
            console.error('[NCALayer] Explicit error reported by NCALayer:', resp);
            finish({
              success: false,
              error: errMsg || 'Ошибка при подписании в NCALayer.',
            });
            return;
          }

          // 4. If this is an intermediate event (e.g. { result: true } or dialog opened status):
          // DO NOT finish yet! Keep waiting for user to complete the file selection dialog!
          console.log('[NCALayer] Intermediate status received, waiting for user completion in dialog...', resp);
        } catch (e: any) {
          console.warn('[NCALayer] Message parse error:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('[NCALayer] WebSocket error:', err);
        finish({
          success: false,
          error: 'Ошибка связи с NCALayer (порт 13579). Убедитесь, что NCALayer запущен.',
        });
      };

      ws.onclose = () => {
        if (!isFinished) {
          console.warn('[NCALayer] WebSocket closed before signature received.');
          finish({
            success: false,
            error: 'Диалог NCALayer закрыт без завершения подписания.',
          });
        }
      };
    });
  }
}
