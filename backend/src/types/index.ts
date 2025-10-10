import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    roles: string[];
  };
  ipAddress?: string;
  session?: {
    jobId?: string;
    [key: string]: any;
  };
}

export interface JWTPayload {
  id: number;
  email: string;
  roles: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  stayLoggedIn?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface MuleSoftContractResponse {
  document: string;
  status: string;
  terms: string[];
  products: string[];
  [key: string]: any; // Index signature for Prisma JSON compatibility
}

export interface MuleSoftDataResponse {
  status: string;
  analysis_markdown: string;
  data_table: any[];
  jsonData?: {
    contract_summary?: {
      document: string;
      terms: string[];
      products_reference: string[];
    };
    validation_summary?: {
      matched_products: string[];
      missing_products: string[];
      over_limit_products: string[];
      quantity_discrepancies: Array<{
        product: string;
        expected: number;
        actual: number;
      }>;
      pricing_issues: any[];
      term_violations: any[];
    };
    anomalies_detected?: Array<{
      issue: string;
      explanation: string;
      possible_cause: string;
    }>;
    compliance_score?: string;
    recommendations?: string[];
  };
  [key: string]: any; // Index signature for Prisma JSON compatibility
}

export interface ApiLogData {
  userId?: number;
  jobId?: string;
  requestMethod: string;
  requestUrl: string;
  requestHeaders?: any;
  requestBody?: any;
  responseStatus?: number;
  responseBody?: any;
  responseTimeMs?: number;
  errorMessage?: string;
  relatedRecordType?: string;
  relatedRecordId?: number;
}

export interface ActivityLogData {
  userId?: number;
  jobId?: string;
  actionType: string;
  actionDescription: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  status?: string;
}

export interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  actionUrl?: string;
  relatedRecordType?: string;
  relatedRecordId?: number;
}

export interface ProcessingResult {
  success: boolean;
  analysisRecordId?: number;
  error?: string;
}

