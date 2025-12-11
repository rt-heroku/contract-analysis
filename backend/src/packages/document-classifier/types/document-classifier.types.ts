/**
 * Document classifier types
 */

export type DocumentType =
  | 'purchase_order'
  | 'invoice'
  | 'contract'
  | 'receipt'
  | 'form'
  | 'report'
  | 'letter'
  | 'product_list'
  | 'image'
  | 'table'
  | 'blank'
  | 'unknown';

export interface PageClassification {
  pageNumber: number;
  documentType: DocumentType;
  confidence: number;
  extractedText: string;
  textLength: number;
  hasImages: boolean;
  hasTables: boolean;
  metadata?: {
    language?: string;
    ocrConfidence?: number;
    processingTime?: number;
    reasoning?: string;
    suggestedFields?: string[];
    [key: string]: unknown;
  };
}

export interface DocumentAnalysisResult {
  success: boolean;
  totalPages: number;
  pages: PageClassification[];
  summary: {
    documentTypes: Record<DocumentType, number>;
    totalProcessingTime: number;
    averageConfidence: number;
  };
  error?: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  processingTime: number;
}

export interface ClassificationRequest {
  extractedText: string;
  pageNumber: number;
  textLength: number;
}

export interface ClassificationResponse {
  documentType: DocumentType;
  confidence: number;
  reasoning?: string;
  suggestedFields?: string[];
}

export interface DocumentAnalyzerOptions {
  language?: string;
  useAI?: boolean;
  includeMetadata?: boolean;
  ocrQuality?: 'fast' | 'balanced' | 'accurate';
}

