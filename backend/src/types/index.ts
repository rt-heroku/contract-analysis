import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    roles: string[];
  };
  ipAddress?: string;
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
}

export interface MuleSoftDataResponse {
  status: string;
  analysis_markdown: string;
  data_table: any[];
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

