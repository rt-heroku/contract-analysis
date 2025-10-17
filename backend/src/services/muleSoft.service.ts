import axios, { AxiosRequestConfig } from 'axios';
import { getMuleSoftConfig } from '../config/muleSoft';
import logger from '../utils/logger';
import loggingService from './logging.service';
import { MuleSoftContractResponse, MuleSoftDataResponse } from '../types';
import { sanitizeHeaders } from '../utils/helpers';

export interface IdpExecutionConfig {
  id?: number;
  protocol: string;
  host: string;
  basePath: string;
  orgId: string;
  actionId: string;
  actionVersion: string;
  authClientId: string;
  authClientSecret: string;
}

class MuleSoftService {
  private async makeRequest<T>(
    endpoint: string,
    jobId: string,
    userId?: number,
    jobIdParam?: string,
    relatedRecordType?: string,
    relatedRecordId?: number,
    requestBody?: any,
    idpConfig?: IdpExecutionConfig
  ): Promise<T> {
    const startTime = Date.now();
    
    // Always use MuleSoft API from env/config
    const muleSoftConfig = await getMuleSoftConfig();
    const fullUrl = `${muleSoftConfig.baseUrl}${endpoint}?job=${jobId}`;
    
    // Use longer timeout if IDP config is provided (IDP calls can take longer)
    const timeout = idpConfig ? 300000 : muleSoftConfig.timeout; // 5 min for IDP, default otherwise
    
    if (idpConfig) {
      logger.info(`Using IDP Execution configuration for ${endpoint} (IDP config will be sent in body)`);
    } else {
      logger.info(`Using default MuleSoft configuration for ${endpoint}`);
    }

    const config: AxiosRequestConfig = {
      timeout,
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
    let bodyToSend = requestBody || {};
    
    // If using IDP config, add auth credentials and IDP request structure to body
    if (idpConfig) {
      bodyToSend = {
        ...bodyToSend,
        job_id: jobId,
        auth_client_id: idpConfig.authClientId,
        auth_client_secret: idpConfig.authClientSecret,
        idp_http_request: {
          host: idpConfig.host,
          base_path: `${idpConfig.basePath}${idpConfig.orgId}/`,
          executions_path: `actions/${idpConfig.actionId}/versions/${idpConfig.actionVersion}/executions`,
          protocol: idpConfig.protocol,
        },
      };
    }

    try {
      logger.info(`Making MuleSoft API request to ${endpoint} with jobId: ${jobId}`);
      if (requestBody) {
        logger.info(`Request includes payload from previous step`);
      }
      
      // Debug: Log the complete request details
      logger.info('=== MuleSoft API Request Details ===');
      logger.info(`URL: ${fullUrl}`);
      logger.info(`Method: POST`);
      logger.info(`Request Body: ${JSON.stringify(bodyToSend, null, 2)}`);
      logger.info('====================================');
      
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
    uploadId?: number,
    idpConfig?: IdpExecutionConfig
  ): Promise<MuleSoftContractResponse> {
    const config = await getMuleSoftConfig();
    const endpoint = config.endpoints.processDocument;

    return this.makeRequest<MuleSoftContractResponse>(
      endpoint,
      jobId,
      userId,
      jobId,
      'upload',
      uploadId,
      undefined, // no request body for processDocument
      idpConfig
    );
  }

  /**
   * Analyze data file with contract context
   */
  async analyzeDataFile(
    jobId: string,
    userId?: number,
    analysisId?: number,
    contractResult?: MuleSoftContractResponse,
    prompt?: { id: number; name: string },
    variables?: Record<string, any>
  ): Promise<MuleSoftDataResponse> {
    const config = await getMuleSoftConfig();
    const endpoint = config.endpoints.analyzeData;

    // Build request body in new format
    const requestBody: any = {
      job_id: jobId,
    };

    // Add prompt if provided
    if (prompt) {
      requestBody.prompt = {
        id: prompt.id,
        name: prompt.name,
      };
    }

    // Build variables array
    const variablesArray: Array<{ name: string; value: any }> = [];
    
    // Add contract as a variable if provided
    if (contractResult) {
      variablesArray.push({
        name: 'contract',
        value: contractResult,
      });
    }

    // Add additional variables if provided
    if (variables) {
      Object.entries(variables).forEach(([name, value]) => {
        // Don't duplicate contract if already added
        if (name !== 'contract' || !contractResult) {
          variablesArray.push({ name, value });
        }
      });
    }

    requestBody.variables = variablesArray;

    return this.makeRequest<MuleSoftDataResponse>(
      endpoint,
      jobId,
      userId,
      jobId,
      'contract_analysis',
      analysisId,
      requestBody
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

