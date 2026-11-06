import { lookup } from 'dns/promises';
import { isIP } from 'net';
import https from 'https';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'zlib';

async function publicLookup(hostname: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const addresses = await Promise.race([
      lookup(hostname, { all: true }),
      new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error('DNS timeout')), 10000); timer.unref(); }),
    ]);
    if (!addresses.length || addresses.some(address => !isPublicAddress(address.address))) throw new Error('Private or reserved integration address');
    return addresses[0];
  } finally { if (timer) clearTimeout(timer); }
}

const DEFAULT_HOSTS = [
  'nationalcatalog.kz', 'developer.nct.kz', 'nct.kz', 'api.markirovka.kz',
  'markirovka.kz', 'prod.markirovka.kz', 'test.markirovka.kz',
  'stage.ismet.kz', 'elk.prod.markirovka.ismet.kz',
];

export function isPublicAddress(address: string): boolean {
  const value = address.replace(/^\[|\]$/g, '').toLowerCase();
  if (isIP(value) === 4) {
    const [a, b, c] = value.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
      || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19))
      || (a === 192 && b === 0) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113));
  }
  if (isIP(value) === 6) {
    return /^[23][0-9a-f]{3}:/.test(value) && !/^2001:(db8:|0*:|:)/.test(value) && !value.startsWith('2002:');
  }
  return false;
}

function httpsUrl(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || (url.port && url.port !== '443') || url.username || url.password || url.hash || url.hostname.endsWith('.')) {
    throw new Error('Адрес запрещен: разрешён только HTTPS без учётных данных, нестандартного порта и фрагмента.');
  }
  return url;
}

export function validateTrustedIntegrationUrl(raw: string): URL {
  const url = httpsUrl(raw);
  const hosts = [...DEFAULT_HOSTS, ...(process.env.INTEGRATION_ALLOWED_HOSTS || '').split(',').map(host => host.trim().toLowerCase()).filter(Boolean)];
  if (!hosts.includes(url.hostname.toLowerCase())) throw new Error('Адрес интеграции запрещен: требуется доверенный сервер из списка разрешённых.');
  return url;
}

export async function integrationFetch(url: string | URL, options: RequestInit = {}): Promise<Response> {
  const trusted = validateTrustedIntegrationUrl(String(url));
  const selected = await publicLookup(trusted.hostname);
  const webRequest = new Request(trusted, options);
  const bytes = webRequest.body ? Buffer.from(await webRequest.arrayBuffer()) : undefined;
  const maximum = 20 * 1024 * 1024;
  if (bytes && bytes.length > maximum) throw new Error('Integration request exceeds 20MB');
  return new Promise((resolve, reject) => {
    const request = https.request(trusted, {
      method: webRequest.method, agent: false,
      headers: { ...Object.fromEntries(webRequest.headers), 'accept-encoding': 'identity', ...(bytes ? { 'content-length': String(bytes.length) } : {}) },
      signal: options.signal || AbortSignal.timeout(30000),
      lookup: ((_host: string, opts: any, callback: any) => opts.all
        ? callback(null, [selected]) : callback(null, selected.address, selected.family)) as any,
    }, response => {
      const status = response.statusCode || 502;
      if (status >= 300 && status < 400) { response.destroy(); reject(new Error('Integration redirects are forbidden')); return; }
      let size = 0; const chunks: Buffer[] = [];
      response.on('data', chunk => {
        size += chunk.length;
        if (size > maximum) { response.destroy(new Error('Integration response exceeds 20MB')); return; }
        chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => {
        try {
          let body: Buffer = Buffer.concat(chunks);
          const encoding = response.headers['content-encoding'];
          if (encoding === 'gzip') body = gunzipSync(body, { maxOutputLength: maximum });
          else if (encoding === 'deflate') body = inflateSync(body, { maxOutputLength: maximum });
          else if (encoding === 'br') body = brotliDecompressSync(body, { maxOutputLength: maximum });
          else if (encoding && encoding !== 'identity') throw new Error('Unsupported response encoding');
          const headers = new Headers();
          for (const [key, value] of Object.entries(response.headers)) if (value !== undefined && !['content-encoding', 'content-length'].includes(key)) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
          resolve(new Response([204, 205, 304].includes(status) ? null : new Uint8Array(body), { status, headers }));
        } catch (error) { reject(error); }
      });
    });
    request.on('error', reject);
    request.end(bytes);
  });
}

export async function fetchPublicImage(raw: string): Promise<Blob> {
  let url = httpsUrl(raw);
  for (let redirect = 0; redirect <= 3; redirect++) {
    const selected = await publicLookup(url.hostname);
    const result = await new Promise<{ location?: string; blob?: Blob }>((resolve, reject) => {
      const request = https.get(url, {
        agent: false, headers: { 'Accept-Encoding': 'identity' }, signal: AbortSignal.timeout(10000),
        // Pin the checked address: a second DNS answer cannot redirect the socket internally.
        lookup: ((_host: string, options: any, callback: any) => options.all
          ? callback(null, [selected]) : callback(null, selected.address, selected.family)) as any,
      }, response => {
        if (response.statusCode && [301, 302, 303, 307, 308].includes(response.statusCode)) {
          response.resume(); resolve({ location: response.headers.location }); return;
        }
        const mime = String(response.headers['content-type'] || '').split(';')[0];
        if (response.statusCode !== 200 || !['image/png', 'image/jpeg', 'image/webp'].includes(mime)
          || (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity')) {
          response.destroy(); reject(new Error('Unsupported image response')); return;
        }
        let size = 0; const chunks: Buffer[] = [];
        response.on('data', chunk => {
          size += chunk.length;
          if (size > 10 * 1024 * 1024) { response.destroy(new Error('Image exceeds 10MB')); return; }
          chunks.push(chunk);
        });
        response.on('error', reject);
        response.on('end', () => resolve({ blob: new Blob([new Uint8Array(Buffer.concat(chunks))], { type: mime }) }));
      });
      request.on('error', reject);
    });
    if (result.blob) return result.blob;
    if (!result.location) throw new Error('Invalid image redirect');
    url = httpsUrl(new URL(result.location, url).toString());
  }
  throw new Error('Too many image redirects');
}
