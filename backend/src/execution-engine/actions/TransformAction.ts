import { ActionHandler } from '../ActionExecutor';
import { ExecutionContext } from '../ProcessExecutor';
import logger from '../../utils/logger';

/**
 * Transform Action
 * Transforms data using mappings or scripts
 */
export class TransformAction implements ActionHandler {
  async execute(inputData: any, config: any, context: ExecutionContext): Promise<any> {
    try {
      const { transformType = 'mapping', mapping, script } = config;

      if (transformType === 'mapping' && !mapping) {
        throw new Error('mapping is required for mapping transform');
      }

      if (transformType === 'script' && !script) {
        throw new Error('script is required for script transform');
      }

      let result: any;

      if (transformType === 'mapping') {
        result = this.applyMapping(inputData, mapping);
      } else if (transformType === 'script') {
        // TODO: Implement script-based transform with vm2
        throw new Error('Script-based transform not yet implemented');
      } else if (transformType === 'jsonpath') {
        // TODO: Implement JSONPath transform
        throw new Error('JSONPath transform not yet implemented');
      } else {
        throw new Error(`Unknown transform type: ${transformType}`);
      }

      logger.info(`Transform completed: ${transformType}`);

      return result;
    } catch (error: any) {
      logger.error('Transform action failed:', error);
      throw new Error(`Data transformation failed: ${error.message}`);
    }
  }

  /**
   * Apply field mapping transformation
   * Mapping format: { "outputField": "inputField" } or { "outputField": "{{template}}" }
   */
  private applyMapping(inputData: any, mapping: any): any {
    const result: any = {};

    for (const [outputKey, mappingValue] of Object.entries(mapping)) {
      if (typeof mappingValue === 'string') {
        // Check if it's a template
        if (mappingValue.includes('{{')) {
          result[outputKey] = this.interpolate(mappingValue, inputData);
        } else {
          // Direct field mapping
          result[outputKey] = this.getNestedValue(inputData, mappingValue);
        }
      } else if (typeof mappingValue === 'object') {
        // Nested mapping
        result[outputKey] = this.applyMapping(inputData, mappingValue);
      } else {
        // Static value
        result[outputKey] = mappingValue;
      }
    }

    return result;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Interpolate variables in template
   */
  private interpolate(template: string, data: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.getNestedValue(data, key.trim());
      return value !== undefined ? String(value) : match;
    });
  }
}

