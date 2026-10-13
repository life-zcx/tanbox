import puppeteer, { Browser } from 'puppeteer-core';
import fs from 'fs';

let browserInstance: Browser | null = null;

function resolveChromiumPath(): string {
  if (process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH;
  }
  const candidates = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser';
}

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  const executablePath = resolveChromiumPath();

  browserInstance = await puppeteer.launch({
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-extensions',
    ],
    headless: true,
  });

  browserInstance.on('disconnected', () => {
    browserInstance = null;
  });

  return browserInstance;
}

export interface PdfRenderOptions {
  landscape?: boolean;
}

let renderCount = 0;

export async function renderHtmlToPdf(
  html: string,
  options: PdfRenderOptions = {}
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // 1. Disable JavaScript execution for static document rendering
    await page.setJavaScriptEnabled(false);

    // 2. Intercept and block unauthorized external network requests and local file:// reads
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url().toLowerCase();
      // Allow inline data URLs (e.g. data:image/...) and blank pages
      if (url.startsWith('data:') || url === 'about:blank') {
        req.continue();
      } else {
        req.abort();
      }
    });

    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 15000,
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: options.landscape || false,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '8mm',
        bottom: '8mm',
        left: '10mm',
        right: '10mm',
      },
    });

    renderCount++;
    // Periodically recycle Chromium process to prevent memory fragmentation on 4GB RAM VPS
    if (renderCount >= 50) {
      renderCount = 0;
      setTimeout(async () => {
        try {
          if (browserInstance) {
            const oldBrowser = browserInstance;
            browserInstance = null;
            await oldBrowser.close();
          }
        } catch {}
      }, 100);
    }

    return Buffer.from(pdfBuffer);
  } catch (err) {
    // If page or browser crashed, reset instance so next request launches a clean Chromium
    if (!browser.connected) {
      browserInstance = null;
    }
    throw err;
  } finally {
    await page.close().catch(() => {});
  }
}
