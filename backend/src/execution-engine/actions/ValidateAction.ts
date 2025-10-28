import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import logger from '../../utils/logger';

export class ValidateAction {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  async execute(config: any, input: any, context: any): Promise<any> {
    try {
      const { schema, throwOnError = false, dataPath = null } = config;

      if (!schema) {
        throw new Error('VALIDATE requires a JSON schema');
      }

      // Extract data to validate
      const data = dataPath ? this.extractData(input, dataPath) : input;

      logger.info('VALIDATE: Validating data against schema');

      // Compile schema
      const validate = this.ajv.compile(schema);

      // Validate
      const valid = validate(data);

      const result = {
        valid,
        errors: valid ? [] : this.formatErrors(validate.errors || []),
        data,
        schema,
      };

      if (!valid && throwOnError) {
        throw new Error(`Validation failed: ${JSON.stringify(result.errors)}`);
      }

      logger.info(`VALIDATE: ${valid ? 'Valid' : `Invalid (${result.errors.length} errors)`}`);

      return result;
    } catch (error: any) {
      logger.error('VALIDATE action error:', error);
      throw error;
    }
  }

  private extractData(input: any, path: string): any {
    const parts = path.split('.');
    let current = input;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  private formatErrors(errors: any[]): any[] {
    return errors.map(err => ({
      path: err.instancePath || err.dataPath,
      keyword: err.keyword,
      message: err.message,
      params: err.params,
    }));
  }
}

