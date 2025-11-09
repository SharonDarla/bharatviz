import sharp from 'sharp';
import { jsPDF } from 'jspdf';
// svg2pdf.js is a CommonJS module, import as default
import svg2pdfModule from 'svg2pdf.js';

/**
 * Export service for converting SVG to various formats
 */
export class ExportService {
  /**
   * Extract dimensions from SVG string
   */
  private extractSVGDimensions(svgString: string): { width: number; height: number } {
    // Try to extract width and height attributes
    const widthMatch = svgString.match(/width="(\d+)"/);
    const heightMatch = svgString.match(/height="(\d+)"/);

    if (widthMatch && heightMatch) {
      return {
        width: parseInt(widthMatch[1]),
        height: parseInt(heightMatch[1])
      };
    }

    // Fallback to viewBox if width/height not found
    const viewBoxMatch = svgString.match(/viewBox="0 0 (\d+) (\d+)"/);
    if (viewBoxMatch) {
      return {
        width: parseInt(viewBoxMatch[1]),
        height: parseInt(viewBoxMatch[2])
      };
    }

    // Default to 800x800 (states map)
    return { width: 800, height: 800 };
  }

  /**
   * Convert SVG string to PNG (base64)
   * High-quality 300 DPI export suitable for print
   */
  async svgToPNG(svgString: string): Promise<string> {
    // Extract SVG dimensions
    const { width, height } = this.extractSVGDimensions(svgString);

    // 300 DPI for high-quality print output
    const dpiScale = 300 / 96;
    const targetWidth = Math.round(width * dpiScale);
    const targetHeight = Math.round(height * dpiScale);

    // Use sharp to convert SVG to PNG at 300 DPI
    const pngBuffer = await sharp(Buffer.from(svgString))
      .png({
        quality: 100,
        compressionLevel: 6,  // Balance between size and speed
        adaptiveFiltering: false
      })
      .resize(targetWidth, targetHeight, {
        fit: 'fill',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        kernel: 'lanczos3'
      })
      .toBuffer();

    return pngBuffer.toString('base64');
  }

  /**
   * Convert SVG string to base64 encoded SVG
   */
  async svgToBase64(svgString: string): Promise<string> {
    const buffer = Buffer.from(svgString);
    return buffer.toString('base64');
  }

  /**
   * Convert SVG string to PDF (base64)
   * Attempts vector conversion, falls back to high-quality PNG if needed
   */
  async svgToPDF(svgString: string): Promise<string> {
    // Try vector PDF first
    try {
      return await this.svgToPDFVector(svgString);
    } catch (error) {
      // Vector conversion failed (likely JSDOM limitations with getBBox)
      // Fall back to PNG-based PDF (still high quality at 300 DPI)
      console.warn('Vector PDF conversion failed, using high-quality PNG fallback:', error);
      return await this.svgToPDFRaster(svgString);
    }
  }

  /**
   * Convert SVG to PDF using vector graphics (preserves editability)
   * Note: May fail with complex SVGs in Node.js environment
   */
  private async svgToPDFVector(svgString: string): Promise<string> {
    const { width, height } = this.extractSVGDimensions(svgString);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;

    const availableWidth = pdfWidth - (2 * margin);
    const availableHeight = pdfHeight - (2 * margin);

    const svgAspectRatio = width / height;
    const availableAspectRatio = availableWidth / availableHeight;

    let scaledWidth, scaledHeight;
    if (svgAspectRatio > availableAspectRatio) {
      scaledWidth = availableWidth;
      scaledHeight = availableWidth / svgAspectRatio;
    } else {
      scaledHeight = availableHeight;
      scaledWidth = availableHeight * svgAspectRatio;
    }

    const x = (pdfWidth - scaledWidth) / 2;
    const y = (pdfHeight - scaledHeight) / 2;

    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(`<!DOCTYPE html><html><body>${svgString}</body></html>`, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    const svgElement = dom.window.document.querySelector('svg');
    if (!svgElement) {
      throw new Error('Invalid SVG: no SVG element found');
    }

    const originalDocument = (global as { document?: Document }).document;
    const originalWindow = (global as { window?: Window }).window;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).document = dom.window.document;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = dom.window;

      const svg2pdf = (svg2pdfModule as unknown as (svg: SVGElement, pdf: jsPDF, options: Record<string, number>) => Promise<jsPDF>);
      await svg2pdf(svgElement, pdf, { x, y, width: scaledWidth, height: scaledHeight });
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).document = originalDocument;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = originalWindow;
    }

    const pdfOutput = pdf.output('arraybuffer');
    return Buffer.from(pdfOutput).toString('base64');
  }

  /**
   * Convert SVG to PDF using high-quality PNG (300 DPI)
   * More memory intensive but guaranteed to work
   */
  private async svgToPDFRaster(svgString: string): Promise<string> {
    const { width, height } = this.extractSVGDimensions(svgString);

    // Use 300 DPI for high-quality print output
    const pngBase64 = await this.svgToPNG(svgString);
    const pngDataUrl = `data:image/png;base64,${pngBase64}`;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    const availableWidth = pdfWidth - (2 * margin);
    const availableHeight = pdfHeight - (2 * margin);

    const imgAspectRatio = width / height;
    const availableAspectRatio = availableWidth / availableHeight;

    let imgWidth, imgHeight;
    if (imgAspectRatio > availableAspectRatio) {
      imgWidth = availableWidth;
      imgHeight = availableWidth / imgAspectRatio;
    } else {
      imgHeight = availableHeight;
      imgWidth = availableHeight * imgAspectRatio;
    }

    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;

    pdf.addImage(pngDataUrl, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');

    const pdfOutput = pdf.output('arraybuffer');
    return Buffer.from(pdfOutput).toString('base64');
  }

  /**
   * Get MIME type for format
   */
  getMimeType(format: 'png' | 'svg' | 'pdf'): string {
    const mimeTypes = {
      png: 'image/png',
      svg: 'image/svg+xml',
      pdf: 'application/pdf'
    };
    return mimeTypes[format];
  }
}
