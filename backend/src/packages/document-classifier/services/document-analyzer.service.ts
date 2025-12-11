import fs from 'fs/promises';
import { OCRService } from './ocr.service';
import { ClassifierService } from './classifier.service';
import { PDFUtils } from '../utils/pdf-utils';
import {
  DocumentAnalysisResult,
  DocumentAnalyzerOptions,
  DocumentType,
  PageClassification,
  ClassificationResponse,
} from '../types/document-classifier.types';

/**
 * Document Analyzer Service
 * Main orchestrator: OCR → AI Classification → Results
 */
export class DocumentAnalyzerService {
  private classifier: ClassifierService;

  constructor() {
    this.classifier = new ClassifierService();
  }

  /**
   * Analyze entire document (PDF or image)
   */
  async analyzeDocument(
    filePath: string,
    options: DocumentAnalyzerOptions = {}
  ): Promise<DocumentAnalysisResult> {
    const startTime = Date.now();
    const {
      language = 'eng',
      useAI = true,
      includeMetadata = true,
    } = options;

    try {
      const ext = filePath.toLowerCase().split('.').pop();

      let pages: PageClassification[];
      let totalPages: number;

      if (ext === 'pdf') {
        pages = await this.analyzePDF(filePath, language, useAI, includeMetadata);
        totalPages = pages.length;
      } else if (ext && ['png', 'jpg', 'jpeg', 'tiff', 'bmp', 'gif'].includes(ext)) {
        pages = [await this.analyzeImage(filePath, 1, language, useAI, includeMetadata)];
        totalPages = 1;
      } else {
        throw new Error(`Unsupported file type: ${ext}`);
      }

      const documentTypes: Record<DocumentType, number> = {} as Record<DocumentType, number>;
      let totalConfidence = 0;

      pages.forEach((page) => {
        documentTypes[page.documentType] = (documentTypes[page.documentType] || 0) + 1;
        totalConfidence += page.confidence;
      });

      const totalProcessingTime = Date.now() - startTime;

      return {
        success: true,
        totalPages,
        pages,
        summary: {
          documentTypes,
          totalProcessingTime,
          averageConfidence: Math.round(totalConfidence / pages.length),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Document analysis failed';
      // eslint-disable-next-line no-console
      console.error('Document analysis failed:', message);
      return {
        success: false,
        totalPages: 0,
        pages: [],
        summary: {
          documentTypes: {} as Record<DocumentType, number>,
          totalProcessingTime: Date.now() - startTime,
          averageConfidence: 0,
        },
        error: message,
      };
    } finally {
      await fs.unlink(filePath).catch(() => undefined);
    }
  }

  private async analyzePDF(
    pdfPath: string,
    language: string,
    useAI: boolean,
    includeMetadata: boolean
  ): Promise<PageClassification[]> {
    // eslint-disable-next-line no-console
    console.log('Analyzing PDF:', pdfPath);

    const directText = await PDFUtils.extractTextDirect(pdfPath);

    if (directText) {
      // eslint-disable-next-line no-console
      console.log('PDF has embedded text, using direct extraction');
      const pages = this.splitTextIntoPages(directText);
      return this.classifyPages(pages, language, useAI, includeMetadata);
    }

    // eslint-disable-next-line no-console
    console.log('PDF is scanned, using OCR...');
    const pageImages = await PDFUtils.allPagesToImages(pdfPath);

    // eslint-disable-next-line no-console
    console.log(`Extracting text from ${pageImages.length} pages...`);
    const ocrResults = await OCRService.extractTextBatch(pageImages, language);

    const classifications: ClassificationResponse[] = useAI
      ? await this.classifier.classifyBatch(
          ocrResults.map((ocr, idx) => ({
            extractedText: ocr.text,
            pageNumber: idx + 1,
            textLength: ocr.text.length,
          }))
        )
      : ocrResults.map(() => ({
          documentType: 'unknown' as DocumentType,
          confidence: 0,
          reasoning: undefined,
          suggestedFields: undefined,
        }));

    return ocrResults.map((ocr, idx) => ({
      pageNumber: idx + 1,
      documentType: classifications[idx].documentType,
      confidence: classifications[idx].confidence,
      extractedText: ocr.text,
      textLength: ocr.text.length,
      hasImages: this.detectImages(ocr.text),
      hasTables: this.detectTables(ocr.text),
      metadata: includeMetadata
        ? {
            language: ocr.language,
            ocrConfidence: ocr.confidence,
            processingTime: ocr.processingTime,
            reasoning: classifications[idx]?.reasoning,
            suggestedFields: classifications[idx]?.suggestedFields,
          }
        : undefined,
    }));
  }

  private async analyzeImage(
    imagePath: string,
    pageNumber: number,
    language: string,
    useAI: boolean,
    includeMetadata: boolean
  ): Promise<PageClassification> {
    // eslint-disable-next-line no-console
    console.log('Analyzing image:', imagePath);

    const ocr = await OCRService.extractText(imagePath, language);

    const classification = useAI
      ? await this.classifier.classifyDocument({
          extractedText: ocr.text,
          pageNumber,
          textLength: ocr.text.length,
        })
      : {
          documentType: 'unknown' as DocumentType,
          confidence: 0,
        };

    return {
      pageNumber,
      documentType: classification.documentType,
      confidence: classification.confidence,
      extractedText: ocr.text,
      textLength: ocr.text.length,
      hasImages: this.detectImages(ocr.text),
      hasTables: this.detectTables(ocr.text),
      metadata: includeMetadata
        ? {
            language: ocr.language,
            ocrConfidence: ocr.confidence,
            processingTime: ocr.processingTime,
            reasoning: classification.reasoning,
            suggestedFields: classification.suggestedFields,
          }
        : undefined,
    };
  }

  private splitTextIntoPages(text: string): string[] {
    return text.split(/\f|\n{4,}/).filter((page) => page.trim().length > 0);
  }

  private async classifyPages(
    pages: string[],
    language: string,
    useAI: boolean,
    includeMetadata: boolean
  ): Promise<PageClassification[]> {
    const classifications: ClassificationResponse[] = useAI
      ? await this.classifier.classifyBatch(
          pages.map((text, idx) => ({
            extractedText: text,
            pageNumber: idx + 1,
            textLength: text.length,
          }))
        )
      : pages.map(() => ({
          documentType: 'unknown' as DocumentType,
          confidence: 0,
          reasoning: undefined,
          suggestedFields: undefined,
        }));

    return pages.map((text, idx) => ({
      pageNumber: idx + 1,
      documentType: classifications[idx].documentType,
      confidence: classifications[idx].confidence,
      extractedText: text,
      textLength: text.length,
      hasImages: this.detectImages(text),
      hasTables: this.detectTables(text),
      metadata: includeMetadata
        ? {
            language,
            reasoning: classifications[idx]?.reasoning,
            suggestedFields: classifications[idx]?.suggestedFields,
          }
        : undefined,
    }));
  }

  private detectImages(text: string): boolean {
    return text.length < 50 || /image|photo|picture|fig\./i.test(text);
  }

  private detectTables(text: string): boolean {
    const tabs = (text.match(/\t/g) || []).length;
    const pipes = (text.match(/\|/g) || []).length;
    return tabs > 10 || pipes > 10;
  }
}

