import { DocumentAnalyzerService } from '../services/document-analyzer.service';
import { ClassifierService } from '../services/classifier.service';
import { OCRService } from '../services/ocr.service';
import {
  DocumentAnalysisResult,
  OCRResult,
  ClassificationResponse,
} from '../types/document-classifier.types';

/**
 * Document Classifier Connector
 * 
 * Wraps document classifier services in a connector pattern for use with
 * connector-based execution engines.
 * 
 * This allows the document classifier to be used as a "connector" in systems
 * that use a unified connector architecture for all external integrations.
 */
export class DocumentClassifierConnector {
  private analyzer: DocumentAnalyzerService;
  private classifier: ClassifierService;

  constructor() {
    this.analyzer = new DocumentAnalyzerService();
    this.classifier = new ClassifierService();
  }

  /**
   * Execute a connector action
   */
  async execute(operation: string, inputData: any): Promise<any> {
    switch (operation) {
      case 'analyze_document':
        return await this.analyzeDocument(inputData);

      case 'extract_text':
        return await this.extractText(inputData);

      case 'classify_text':
        return await this.classifyText(inputData);

      case 'extract_text_batch':
        return await this.extractTextBatch(inputData);

      case 'classify_batch':
        return await this.classifyBatch(inputData);

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  /**
   * Connector Action: analyze_document
   * Analyze PDF or image document with OCR and AI classification
   */
  private async analyzeDocument(inputData: {
    filePath: string;
    language?: string;
    useAI?: boolean;
    includeMetadata?: boolean;
    ocrQuality?: 'fast' | 'balanced' | 'accurate';
  }): Promise<DocumentAnalysisResult> {
    const {
      filePath,
      language = 'eng',
      useAI = true,
      includeMetadata = true,
      ocrQuality = 'balanced',
    } = inputData;

    return await this.analyzer.analyzeDocument(filePath, {
      language,
      useAI,
      includeMetadata,
      ocrQuality,
    });
  }

  /**
   * Connector Action: extract_text
   * Extract text from image using OCR
   */
  private async extractText(inputData: {
    imagePath: string;
    language?: string;
  }): Promise<OCRResult> {
    const { imagePath, language = 'eng' } = inputData;
    return await OCRService.extractText(imagePath, language);
  }

  /**
   * Connector Action: classify_text
   * Classify extracted text using AI
   */
  private async classifyText(inputData: {
    text: string;
    pageNumber?: number;
  }): Promise<ClassificationResponse> {
    const { text, pageNumber = 1 } = inputData;

    return await this.classifier.classifyDocument({
      extractedText: text,
      pageNumber,
      textLength: text.length,
    });
  }

  /**
   * Connector Action: extract_text_batch
   * Extract text from multiple images in batch
   */
  private async extractTextBatch(inputData: {
    imagePaths: string[];
    language?: string;
  }): Promise<OCRResult[]> {
    const { imagePaths, language = 'eng' } = inputData;
    return await OCRService.extractTextBatch(imagePaths, language);
  }

  /**
   * Connector Action: classify_batch
   * Classify multiple texts in batch
   */
  private async classifyBatch(inputData: {
    texts: Array<{
      text: string;
      pageNumber?: number;
    }>;
  }): Promise<ClassificationResponse[]> {
    const requests = inputData.texts.map((item, idx) => ({
      extractedText: item.text,
      pageNumber: item.pageNumber || idx + 1,
      textLength: item.text.length,
    }));

    return await this.classifier.classifyBatch(requests);
  }
}

/**
 * Connector Executor Integration Example
 * 
 * To integrate with a ConnectorExecutor, add this case to your executor:
 * 
 * ```typescript
 * case 'document_classifier':
 *   return await this.executeDocumentClassifierAction(connector, action, inputData);
 * 
 * private async executeDocumentClassifierAction(connector: any, action: any, inputData: any) {
 *   const docClassifier = new DocumentClassifierConnector();
 *   return await docClassifier.execute(action.operation, inputData);
 * }
 * ```
 * 
 * Or make it more generic:
 * 
 * ```typescript
 * case 'custom':
 *   if (connector.name === 'document_classifier') {
 *     const docClassifier = new DocumentClassifierConnector();
 *     return await docClassifier.execute(action.operation, inputData);
 *   }
 *   throw new Error(`Unknown custom connector: ${connector.name}`);
 * ```
 */

export default DocumentClassifierConnector;


