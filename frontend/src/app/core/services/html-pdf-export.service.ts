import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

type Html2PdfWorker = {
  set: (options: Record<string, unknown>) => Html2PdfWorker;
  from: (source: HTMLElement) => Html2PdfWorker;
  save: () => Promise<void>;
};

type Html2PdfFactory = () => Html2PdfWorker;

@Injectable({ providedIn: 'root' })
export class HtmlPdfExportService {
  private readonly document = inject(DOCUMENT);
  private readonly classicPdfMarginsMm = [12, 0, 14, 0] as const;

  async download(element: HTMLElement, fileName: string): Promise<void> {
    const html2pdfModule = (await import('html2pdf.js')) as { default?: Html2PdfFactory } & Record<string, unknown>;
    const html2pdf = (html2pdfModule.default ?? html2pdfModule) as Html2PdfFactory;
    const container = this.document.createElement('div');
    const clone = element.cloneNode(true) as HTMLElement;

    container.className = 'pdf-export-staging';
    container.setAttribute('aria-hidden', 'true');
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.pointerEvents = 'none';
    container.style.opacity = '0';
    container.style.zIndex = '-1';
    container.style.overflow = 'hidden';
    container.style.background = '#fff';
    clone.style.width = '210mm';
    clone.style.margin = '0';

    container.appendChild(clone);
    this.document.body.appendChild(container);

    try {
      await html2pdf()
        .set({
          filename: fileName,
          // html2pdf.js only supports page margins globally, not per-page after-break offsets.
          margin: this.classicPdfMarginsMm,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
          },
          pagebreak: {
            mode: ['css', 'legacy'],
          },
        })
        .from(clone)
        .save();
    } finally {
      container.remove();
    }
  }
}
