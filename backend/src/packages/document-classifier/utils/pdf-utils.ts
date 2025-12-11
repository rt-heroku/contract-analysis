import pdf from 'pdf-parse';
import { createCanvas } from 'canvas';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import fs from 'fs/promises';

/**
 * PDF Utilities
 * Extract pages and convert to images for OCR
 */
export class PDFUtils {
  /**
   * Try to extract text directly from PDF first
   */
  static async extractTextDirect(pdfPath: string): Promise<string | null> {
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const data = await pdf(dataBuffer);

      if (data.text.trim().length > 100) {
        return data.text;
      }

      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Direct text extraction failed:', error);
      return null;
    }
  }

  /**
   * Get number of pages in PDF
   */
  static async getPageCount(pdfPath: string): Promise<number> {
    const dataBuffer = await fs.readFile(pdfPath);
    const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
    const pdfDocument = await loadingTask.promise;
    return pdfDocument.numPages;
  }

  /**
   * Convert PDF page to image buffer for OCR
   */
  static async pageToImage(
    pdfPath: string,
    pageNumber: number,
    scale: number = 2.0
  ): Promise<Buffer> {
    const dataBuffer = await fs.readFile(pdfPath);
    const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
    const pdfDocument = await loadingTask.promise;

    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({
      canvasContext: context as any,
      viewport,
    }).promise;

    return canvas.toBuffer('image/png');
  }

  /**
   * Convert all PDF pages to image buffers
   */
  static async allPagesToImages(
    pdfPath: string,
    scale: number = 2.0
  ): Promise<Buffer[]> {
    const pageCount = await this.getPageCount(pdfPath);
    const images: Buffer[] = [];

    // eslint-disable-next-line no-console
    console.log(`Converting ${pageCount} PDF pages to images...`);

    for (let i = 1; i <= pageCount; i += 1) {
      // eslint-disable-next-line no-console
      console.log(`Converting page ${i}/${pageCount}...`);
      const imageBuffer = await this.pageToImage(pdfPath, i, scale);
      images.push(imageBuffer);
    }

    return images;
  }
}

