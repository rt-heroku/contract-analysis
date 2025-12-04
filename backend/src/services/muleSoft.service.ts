import axios, { AxiosRequestConfig } from 'axios';
import { getMuleSoftConfig } from '../config/muleSoft';
import logger from '../utils/logger';
import loggingService from './logging.service';
import { MuleSoftContractResponse, MuleSoftDataResponse } from '../types';
import { sanitizeHeaders } from '../utils/helpers';
import { getSetting } from '../utils/getSettings';

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
  private timeout = 300000; // 5 minutes default timeout for IDP operations

  private async makeRequest<T>(
    endpoint: string,
    jobId: string,
    userId?: number,
    jobIdParam?: string,
    relatedRecordType?: string,
    relatedRecordId?: number,
    requestBody?: any,
    idpConfig?: IdpExecutionConfig,
    apiConfig?: any
  ): Promise<T> {
    const startTime = Date.now();
    
    // Use provided API config or fall back to system config
    const muleSoftConfig = apiConfig || (await getMuleSoftConfig());
    const fullUrl = `${muleSoftConfig.baseUrl}${endpoint}?job=${jobId}`;
    
    // Use longer timeout if IDP config is provided (IDP calls can take longer)
    const timeout = idpConfig ? 300000 : muleSoftConfig.timeout; // 5 min for IDP, default otherwise
    
    if (idpConfig) {
      logger.info(`Using IDP Execution configuration for ${endpoint} (IDP config will be sent in body)`);
    } else if (apiConfig) {
      logger.info(`Using custom MuleSoft API configuration for ${endpoint}`);
    } else {
      logger.info(`Using default MuleSoft configuration for ${endpoint}`);
    }

    const config: AxiosRequestConfig = {
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add authentication based on auth type
    if (apiConfig?.authType === 'basic' && apiConfig.authConfig) {
      const { encryption } = require('../utils/encryption');
      const username = encryption.decrypt(apiConfig.authConfig.username);
      const password = encryption.decrypt(apiConfig.authConfig.password);
      config.auth = { username, password };
    } else if (apiConfig?.authType === 'bearer' && apiConfig.authConfig) {
      const { encryption } = require('../utils/encryption');
      const token = encryption.decrypt(apiConfig.authConfig.token);
      config.headers!['Authorization'] = `Bearer ${token}`;
    } else if (apiConfig?.authType === 'api_key' && apiConfig.authConfig) {
      const { encryption } = require('../utils/encryption');
      const apiKey = encryption.decrypt(apiConfig.authConfig.apiKey);
      const headerName = apiConfig.authConfig.headerName || 'X-API-Key';
      config.headers![headerName] = apiKey;
    } else if (muleSoftConfig.username && muleSoftConfig.password) {
      // Fall back to basic auth from system config
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
          action_id: idpConfig.actionId,
          action_version: idpConfig.actionVersion,
          execution_id: '',
          org_id: idpConfig.orgId,
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
    variables?: Record<string, any>,
    flow?: { name: string; url: string; method: string },
    apiConfig?: any
  ): Promise<MuleSoftDataResponse> {
    // Get default config if no API config provided
    const config = apiConfig || (await getMuleSoftConfig());
    // Use flow URL if provided, otherwise use default endpoint
    const endpoint = flow?.url || (config.endpoints?.analyzeData || '/analyze');
    
    if (flow) {
      logger.info(`Using custom flow endpoint: ${endpoint} (Flow: ${flow.name})`);
    } else {
      logger.info(`Using default endpoint: ${endpoint}`);
    }

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
    
    // Add IDP data as a variable if provided
    if (contractResult) {
      variablesArray.push({
        name: 'idpData',
        value: contractResult,
      });
    }

    // Add additional variables if provided
    if (variables) {
      Object.entries(variables).forEach(([name, value]) => {
        // Don't duplicate idpData if already added
        if (name !== 'idpData' || !contractResult) {
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
      requestBody,
      undefined,
      apiConfig
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
  /**
   * Get processing status from MuleSoft IDP
   */
  async getProcessingStatus(
    executionId: string,
    idpConfig: any,
    jobId: string
  ): Promise<any> {
    try {
      // Priority: 1. Environment variable, 2. Database, 3. Default
      const dbValue = await getSetting('mulesoft_api_url', null);
      const mulesoftUrl = process.env.MULESOFT_API_BASE_URL || dbValue || 'http://localhost:8081';
      const fullUrl = `${mulesoftUrl}/process/status`;

      const requestBody = {
        job_id: jobId,
        execution_id: executionId,
        auth_client_id: idpConfig.authClientId,
        auth_client_secret: idpConfig.authClientSecret,
        anypoint_username: '',
        anypoint_password: '',
        idp_http_request: {
          method: 'POST',
          protocol: idpConfig.protocol,
          host: idpConfig.host,
          base_path: `${idpConfig.basePath}${idpConfig.orgId}/actions/${idpConfig.actionId}/versions/${idpConfig.actionVersion}/executions`,
          action_id: idpConfig.actionId,
          action_version: idpConfig.actionVersion,
          org_id: idpConfig.orgId,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      };

      logger.info('Calling MuleSoft /process/status', { 
        url: fullUrl, 
        executionId,
        jobId 
      });

      const response = await axios.post(fullUrl, requestBody, {
        timeout: this.timeout,
        headers: { 'Content-Type': 'application/json' },
      });

      return response.data;
    } catch (error: any) {
      // Make response data readable
      const responseData = error.response?.data;
      let errorMsg: string;
      if (responseData) {
        errorMsg = typeof responseData === 'string'
          ? responseData
          : JSON.stringify(responseData, null, 2);
      } else {
        errorMsg = error.message;
      }
      logger.error(`MuleSoft status check failed: ${errorMsg}`);
      // Determine thrown message
      let thrownMsg = 'Failed to get processing status from MuleSoft';
      if (responseData && typeof responseData === 'object') {
        thrownMsg = responseData.error || responseData.message || thrownMsg;
      } else if (typeof responseData === 'string') {
        thrownMsg = responseData;
      }
      throw new Error(thrownMsg);
    }
  }

  /**
   * Request manual review from MuleSoft IDP
   */
  async requestReview(
    executionId: string,
    idpConfig: any,
    jobId: string,
    anypointUsername?: string,
    anypointPassword?: string
  ): Promise<any> {
    try {
      // Priority: 1. Environment variable, 2. Database, 3. Default
      const dbValue = await getSetting('mulesoft_api_url', null);
      const mulesoftUrl = process.env.MULESOFT_API_BASE_URL || dbValue || 'http://localhost:8081';
      const fullUrl = `${mulesoftUrl}/process/review`;

      const requestBody: any = {
        job_id: jobId,
        execution_id: executionId,
        idp_http_request: {
          method: 'GET',
          protocol: idpConfig.protocol,
          host: idpConfig.host,
          base_path: `${idpConfig.basePath}${idpConfig.orgId}/actions/${idpConfig.actionId}/versions/${idpConfig.actionVersion}/executions`,
          action_id: idpConfig.actionId,
          action_version: idpConfig.actionVersion,
          org_id: idpConfig.orgId,
          headers: {
            'Content-Type': 'application/json',
          },
        },
        auth_client_id: idpConfig.authClientId,
        auth_client_secret: idpConfig.authClientSecret,
        anypoint_username: anypointUsername,
        anypoint_password: anypointPassword
      };

      logger.info('Calling MuleSoft /process/review', { 
        url: fullUrl, 
        executionId,
        jobId,
        hasCredentials: !!(anypointUsername && anypointPassword)
      });

      const response = await axios.post(fullUrl, requestBody, {
        timeout: this.timeout,
        headers: { 'Content-Type': 'application/json' },
      });

      return response.data;
    } catch (error: any) {
      const responseData = error.response?.data;
      let errorMessage = 'Failed to request review from MuleSoft';
      let isGarbled = false;
      
      // Parse error message (might be garbled JSON object with character indices)
      if (responseData && typeof responseData === 'object') {
        // Check if it's a garbled object (keys are numeric indices)
        const keys = Object.keys(responseData);
        if (keys.length > 0 && keys.every(k => !isNaN(Number(k)))) {
          // Reconstruct string from character indices
          isGarbled = true;
          const reconstructed = keys
            .sort((a, b) => Number(a) - Number(b))
            .map(k => responseData[k])
            .join('');
          errorMessage = reconstructed;
          // Log the readable version, not the garbled one
          logger.error('MuleSoft review request failed:', reconstructed);
        } else {
          // Normal error object
          errorMessage = responseData.error || responseData.message || errorMessage;
          logger.error('MuleSoft review request failed:', responseData);
        }
      } else if (typeof responseData === 'string') {
        errorMessage = responseData;
        logger.error('MuleSoft review request failed:', responseData);
      } else {
        logger.error('MuleSoft review request failed:', error.message);
      }
      
      // Check if it's an authentication error
      if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        throw new Error('ANYPOINT_AUTH_FAILED: Your Anypoint credentials are incorrect. Please enter them again.');
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Approve manual review changes in MuleSoft IDP
   */
  async approveReview(
    executionId: string,
    idpConfig: any,
    jobId: string,
    approvedData: any,
    anypointUsername?: string,
    anypointPassword?: string
  ): Promise<any> {
    try {
      // Priority: 1. Environment variable, 2. Database, 3. Default
      const dbValue = await getSetting('mulesoft_api_url', null);
      const mulesoftUrl = process.env.MULESOFT_API_BASE_URL || dbValue || 'http://localhost:8081';
      const fullUrl = `${mulesoftUrl}/process/approve`;

      const requestBody = {
        job_id: jobId,
        execution_id: executionId,
        approved_data: approvedData,
        idp_http_request: {
          method: 'PATCH',
          protocol: idpConfig.protocol,
          host: idpConfig.host,
          base_path: `${idpConfig.basePath}${idpConfig.orgId}/actions/${idpConfig.actionId}/versions/${idpConfig.actionVersion}/executions`,
          action_id: idpConfig.actionId,
          action_version: idpConfig.actionVersion,
          org_id: idpConfig.orgId,
          headers: {
            'Content-Type': 'application/json',
          },
        },
        auth_client_id: idpConfig.authClientId,
        auth_client_secret: idpConfig.authClientSecret,
        anypoint_username: anypointUsername,
        anypoint_password: anypointPassword
      };

      logger.info('Calling MuleSoft /process/approve', { 
        url: fullUrl, 
        executionId,
        jobId 
      });

      const response = await axios.patch(fullUrl, requestBody, {
        timeout: this.timeout,
        headers: { 'Content-Type': 'application/json' },
      });

      return response.data;
    } catch (error: any) {
      logger.error('MuleSoft approval failed:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to approve review in MuleSoft'
      );
    }
  }
}

export default new MuleSoftService();

