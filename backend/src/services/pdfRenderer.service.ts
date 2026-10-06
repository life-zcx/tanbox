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

export async function renderHtmlToPdf(
  html: string,
  options: PdfRenderOptions = {}
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
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

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close().catch(() => {});
  }
}
