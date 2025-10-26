import sharp from 'sharp';
import { jsPDF } from 'jspdf';

/**
 * Export service for converting SVG to various formats
 */
export class ExportService {
  /**
   * Convert SVG string to PNG (base64)
   */
  async svgToPNG(svgString: string): Promise<string> {
    // Use sharp to convert SVG to PNG with high DPI
    const pngBuffer = await sharp(Buffer.from(svgString))
      .png({
        quality: 100,
        compressionLevel: 9
      })
      .resize(2400, 2400, {  // 3x scale for 300 DPI equivalent
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
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
   */
  async svgToPDF(svgString: string): Promise<string> {
    // First convert to PNG
    const pngBase64 = await this.svgToPNG(svgString);
    const pngDataUrl = `data:image/png;base64,${pngBase64}`;

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    const availableWidth = pdfWidth - (2 * margin);
    const availableHeight = pdfHeight - (2 * margin);

    const imgAspectRatio = 1; // Square 800x800
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

    pdf.addImage(pngDataUrl, 'PNG', x, y, imgWidth, imgHeight);

    // Return as base64
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
