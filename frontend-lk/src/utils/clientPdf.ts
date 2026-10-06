import html2pdf from 'html2pdf.js';

export interface ClientPdfOptions {
  filename: string;
  landscape?: boolean;
}

/**
 * Generates and downloads a PDF directly in the user's browser,
 * offloading 100% of the PDF rendering CPU & RAM load from the backend server.
 */
export async function downloadHtmlAsPdf(
  htmlContent: string,
  options: ClientPdfOptions
): Promise<void> {
  const { filename, landscape = false } = options;

  // Create isolated container
  const container = document.createElement('div');
  container.className = 'client-pdf-render-container';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = landscape ? '297mm' : '210mm';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.zIndex = '-9999';

  // Inject content
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  const pdfConfig = {
    margin: [8, 10, 8, 10],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: landscape ? 'landscape' : 'portrait',
    },
  };

  try {
    const worker = (html2pdf as any)();
    await worker.set(pdfConfig).from(container).save();
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Opens document in a dedicated preview tab with native instant browser print dialog (Ctrl+P / Save as PDF).
 */
export function openHtmlInPrintWindow(htmlContent: string, title: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Всплывающее окно заблокировано браузером');
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
