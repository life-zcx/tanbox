import puppeteer, { Browser } from 'puppeteer-core';
import fs from 'fs';

let browserInstance: Browser | null = null;
let browserLaunch: Promise<Browser> | null = null;
let activeRenders = 0;

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

  if (!browserLaunch) {
    browserLaunch = puppeteer.launch({
      executablePath: resolveChromiumPath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run', '--disable-extensions'],
      headless: true,
    }).then((browser) => {
      browserInstance = browser;
      browser.on('disconnected', () => { if (browserInstance === browser) browserInstance = null; });
      return browser;
    }).finally(() => { browserLaunch = null; });
  }
  return browserLaunch;
}

export interface PdfRenderOptions {
  landscape?: boolean;
}

let renderCount = 0;

export async function renderHtmlToPdf(
  html: string,
  options: PdfRenderOptions = {}
): Promise<Buffer> {
  activeRenders++;
  let page: Awaited<ReturnType<Browser['newPage']>> | undefined;
  let browser: Browser | undefined;
  try {
    browser = await getBrowser();
    page = await browser.newPage();
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
    return Buffer.from(pdfBuffer);
  } catch (err) {
    // If page or browser crashed, reset instance so next request launches a clean Chromium
    if (browser && browserInstance === browser && !browser.connected) {
      browserInstance = null;
    }
    throw err;
  } finally {
    await page?.close().catch(() => {});
    activeRenders--;
    if (activeRenders === 0 && renderCount >= 50 && browserInstance) {
      renderCount = 0;
      const oldBrowser = browserInstance;
      browserInstance = null;
      await oldBrowser.close().catch(() => {});
    }
  }
}
