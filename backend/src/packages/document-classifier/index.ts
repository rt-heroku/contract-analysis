/**
 * Document Classifier Package
 * Portable OCR + AI document classification system
 */

export * from './types/document-classifier.types';
export * from './services/ocr.service';
export * from './services/classifier.service';
export * from './services/document-analyzer.service';
export * from './utils/pdf-utils';
export { default as documentClassifierRoutes } from './routes/document-classifier.routes';

import { DocumentAnalyzerService } from './services/document-analyzer.service';
import { OCRService } from './services/ocr.service';
import { ClassifierService } from './services/classifier.service';
import { DocumentAnalyzerOptions } from './types/document-classifier.types';

export const DocumentClassifier = {
  analyze: (filePath: string, options?: DocumentAnalyzerOptions) =>
    new DocumentAnalyzerService().analyzeDocument(filePath, options),

  extractText: (imagePath: string, language?: string) =>
    OCRService.extractText(imagePath, language),

  classify: (text: string, pageNumber: number) =>
    new ClassifierService().classifyDocument({
      extractedText: text,
      pageNumber,
      textLength: text.length,
    }),
};

