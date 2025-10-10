import axios, { AxiosRequestConfig } from 'axios';
import { getMuleSoftConfig } from '../config/muleSoft';
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
    relatedRecordId?: number,
    requestBody?: any
  ): Promise<T> {
    const startTime = Date.now();
    
    // Get config from database
    const muleSoftConfig = await getMuleSoftConfig();
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
    const bodyToSend = requestBody || {};

    try {
      logger.info(`Making MuleSoft API request to ${endpoint} with jobId: ${jobId}`);
      if (requestBody) {
        logger.info(`Request includes payload from previous step`);
      }
      
      response = await axios.post(fullUrl, bodyToSend, config);

      const duration = Date.now() - startTime;

      // Log successful API call
      await loggingService.logApiCall({
        userId,
        jobId: jobIdParam,
        requestMethod: 'POST',
        requestUrl: fullUrl,
        requestHeaders: sanitizeHeaders(config.headers),
        requestBody: requestBody || { jobId },
        responseStatus: response.status,
        responseBody: response.data,
        responseTimeMs: duration,
        relatedRecordType,
        relatedRecordId,
      });

      logger.info(`MuleSoft API request successful (${duration}ms)`);

      return response.data;
    } catch (err: any) {
      const duration = Date.now() - startTime;

      // Log the actual error properly
      const errorMessage = err.message || 'Unknown error';
      const errorCode = err.code || 'NO_CODE';
      logger.error(`MuleSoft API request failed: ${errorMessage} (Code: ${errorCode})`);

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
    const config = await getMuleSoftConfig();
    const endpoint = config.endpoints.processDocument;

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
   * Analyze data file with contract context
   */
  async analyzeDataFile(
    jobId: string,
    userId?: number,
    analysisId?: number,
    contractResult?: MuleSoftContractResponse
  ): Promise<MuleSoftDataResponse> {
    const config = await getMuleSoftConfig();
    const endpoint = config.endpoints.analyzeData;

    return this.makeRequest<MuleSoftDataResponse>(
      endpoint,
      jobId,
      userId,
      jobId,
      'contract_analysis',
      analysisId,
      contractResult
    );
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const config = await getMuleSoftConfig();
      const response = await axios.get(config.baseUrl, {
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

