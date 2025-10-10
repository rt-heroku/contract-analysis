import axios, { AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import muleSoftConfig from '../config/muleSoft';
import logger from '../utils/logger';
import loggingService from './logging.service';
import { MuleSoftContractResponse, MuleSoftDataResponse } from '../types';
import { sanitizeHeaders } from '../utils/helpers';

class MuleSoftService {
  private async makeRequest<T>(
    endpoint: string,
    jobId: string,
    userId?: number,
    jobIdParam?: string,
    relatedRecordType?: string,
    relatedRecordId?: number
  ): Promise<T> {
    const startTime = Date.now();
    const fullUrl = `${muleSoftConfig.baseUrl}${endpoint}?job=${jobId}`;

    const config: AxiosRequestConfig = {
      timeout: muleSoftConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add basic auth if configured
    if (muleSoftConfig.username && muleSoftConfig.password) {
      config.auth = {
        username: muleSoftConfig.username,
        password: muleSoftConfig.password,
      };
    }

    let response;
    let error: any = null;

    try {
      logger.info(`Making MuleSoft API request to ${endpoint} with jobId: ${jobId}`);
      
      response = await axios.post(fullUrl, {}, config);

      const duration = Date.now() - startTime;

      // Log successful API call
      await loggingService.logApiCall({
        userId,
        jobId: jobIdParam,
        requestMethod: 'POST',
        requestUrl: fullUrl,
        requestHeaders: sanitizeHeaders(config.headers),
        requestBody: { jobId },
        responseStatus: response.status,
        responseBody: response.data,
        responseTimeMs: duration,
        relatedRecordType,
        relatedRecordId,
      });

      logger.info(`MuleSoft API request successful (${duration}ms)`);

      return response.data;
    } catch (err: any) {
      error = err;
      const duration = Date.now() - startTime;

      logger.error('MuleSoft API request failed:', err.message);

      // Log failed API call
      await loggingService.logApiCall({
        userId,
        jobId: jobIdParam,
        requestMethod: 'POST',
        requestUrl: fullUrl,
        requestHeaders: sanitizeHeaders(config.headers),
        requestBody: { jobId },
        responseStatus: err.response?.status,
        responseBody: err.response?.data,
        responseTimeMs: duration,
        errorMessage: err.message,
        relatedRecordType,
        relatedRecordId,
      });

      throw new Error(`MuleSoft API Error: ${err.message}`);
    }
  }

  /**
   * Process contract document
   */
  async processContractDocument(
    jobId: string,
    userId?: number,
    uploadId?: number
  ): Promise<MuleSoftContractResponse> {
    const endpoint = muleSoftConfig.endpoints.processDocument;

    return this.makeRequest<MuleSoftContractResponse>(
      endpoint,
      jobId,
      userId,
      jobId,
      'upload',
      uploadId
    );
  }

  /**
   * Analyze data file
   */
  async analyzeDataFile(
    jobId: string,
    userId?: number,
    analysisId?: number
  ): Promise<MuleSoftDataResponse> {
    const endpoint = muleSoftConfig.endpoints.analyzeData;

    return this.makeRequest<MuleSoftDataResponse>(
      endpoint,
      jobId,
      userId,
      jobId,
      'contract_analysis',
      analysisId
    );
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(muleSoftConfig.baseUrl, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      logger.error('MuleSoft API connection test failed:', error);
      return false;
    }
  }
}

export default new MuleSoftService();

