import { StepHandler } from './StepHandler.interface';
import axios from 'axios';
import logger from '../../utils/logger';

/**
 * API Call Handler
 * 
 * Makes HTTP API calls to external services
 */
export class ApiCallHandler implements StepHandler {
  requiresUserInput(): boolean {
    return false;
  }

  getModalComponent(): string | null {
    return null;
  }

  async execute(stepConfig: any, inputData: any, context: any, userId: number): Promise<any> {
    try {
      const { method, url, headers, body, timeout } = stepConfig;

      if (!url) {
        throw new Error('API URL is required');
      }

      // Resolve variables in URL
      const resolvedUrl = this.resolveVariables(url, { ...context, ...inputData });

      // Resolve variables in headers
      const resolvedHeaders = headers ? this.resolveObject(headers, { ...context, ...inputData }) : {};

      // Resolve variables in body
      const resolvedBody = body ? this.resolveObject(body, { ...context, ...inputData }) : undefined;

      logger.info(`Making API call: ${method || 'GET'} ${resolvedUrl}`);

      const response = await axios({
        method: method || 'GET',
        url: resolvedUrl,
        headers: resolvedHeaders,
        data: resolvedBody,
        timeout: timeout || 30000,
      });

      logger.info(`API call completed: ${response.status}`);

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      };
    } catch (error: any) {
      logger.error('Error in ApiCallHandler:', error);
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  private resolveVariables(template: string, variables: any): string {
    let result = template;
    const matches = template.match(/\{\{([^}]+)\}\}/g) || [];

    matches.forEach(match => {
      const path = match.replace('{{', '').replace('}}', '').trim();
      const value = this.getNestedValue(variables, path);
      result = result.replace(match, value !== undefined ? String(value) : '');
    });

    return result;
  }

  private resolveObject(obj: any, variables: any): any {
    if (typeof obj === 'string') {
      return this.resolveVariables(obj, variables);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.resolveObject(item, variables));
    }

    if (typeof obj === 'object' && obj !== null) {
      const resolved: any = {};
      for (const [key, value] of Object.entries(obj)) {
        resolved[key] = this.resolveObject(value, variables);
      }
      return resolved;
    }

    return obj;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}





