import { ActionHandler } from '../ActionExecutor';
import { ExecutionContext } from '../ProcessExecutor';
import axios from 'axios';
import logger from '../../utils/logger';

/**
 * REST API Call Action
 * Makes HTTP requests to external APIs
 */
export class RestApiCallAction implements ActionHandler {
  async execute(inputData: any, config: any, context: ExecutionContext): Promise<any> {
    try {
      const {
        url,
        method = 'GET',
        headers = {},
        body,
        params,
        timeout = 30000,
      } = { ...inputData, ...config };

      if (!url) {
        throw new Error('URL is required');
      }

      logger.info(`Making REST API call: ${method} ${url}`);

      const response = await axios({
        method,
        url,
        headers,
        data: body,
        params,
        timeout,
        validateStatus: () => true, // Don't throw on any status
      });

      logger.info(`REST API call completed: ${response.status}`);

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      };
    } catch (error: any) {
      logger.error('REST API call failed:', error);

      if (error.response) {
        // Request made but server responded with error
        return {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
          error: true,
        };
      } else if (error.request) {
        // Request made but no response
        throw new Error(`No response from server: ${error.message}`);
      } else {
        // Error setting up request
        throw new Error(`Request setup failed: ${error.message}`);
      }
    }
  }
}

