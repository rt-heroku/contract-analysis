import Tesseract from 'tesseract.js';
import { OCRResult } from '../types/document-classifier.types';

/**
 * OCR Service
 * Extracts text from images using tesseract.js (no system install required)
 */
export class OCRService {
  /**
   * Extract text from image
   */
  static async extractText(
    imagePath: string | Buffer,
    language: string = 'eng'
  ): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      const { data } = await Tesseract.recognize(imagePath, language, {
        logger: (message: any) => {
          if (message.status === 'recognizing text' && typeof message.progress === 'number') {
            const progress = Math.round(message.progress * 100);
            if (progress % 25 === 0) {
              // Light progress logging so we know OCR is running
              // eslint-disable-next-line no-console
              console.log(`OCR progress: ${progress}%`);
            }
          }
        },
      });

      return {
        text: data.text.trim(),
        confidence: Math.round(data.confidence),
        language,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown OCR error';
      // eslint-disable-next-line no-console
      console.error('OCR error:', message);
      throw new Error(`OCR failed: ${message}`);
    }
  }

  /**
   * Extract text from multiple images (parallel processing)
   */
  static async extractTextBatch(
    images: Array<string | Buffer>,
    language: string = 'eng'
  ): Promise<OCRResult[]> {
    // eslint-disable-next-line no-console
    console.log(`Processing ${images.length} images in parallel...`);

    const promises = images.map((image, index) =>
      this.extractText(image, language).catch(() => ({
        text: '',
        confidence: 0,
        language,
        processingTime: 0,
      }))
    );

    return Promise.all(promises);
  }
}

