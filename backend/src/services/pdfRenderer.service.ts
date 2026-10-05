import puppeteer, { Browser } from 'puppeteer-core';

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser';

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
