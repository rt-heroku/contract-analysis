import logger from '../utils/logger';
import axios from 'axios';
import * as yaml from 'js-yaml';

interface OpenAPISpec {
  openapi?: string;
  swagger?: string; // For Swagger 2.0
  info: any;
  servers?: any[];
  paths: Record<string, Record<string, any>>;
  components?: any;
}

export interface FlowPreview {
  name: string;
  description?: string;
  url: string;
  method: string;
  vars: Array<{
    name: string;
    type: string;
    mandatory: boolean;
  }>;
}

export class FlowOpenAPIImporterService {
  /**
   * Parse OpenAPI spec from string (JSON or YAML)
   */
  private parseSpec(specString: string): OpenAPISpec {
    try {
      // First try JSON parsing
      logger.info('Attempting to parse spec as JSON...');
      return JSON.parse(specString);
    } catch (jsonError) {
      // If JSON parsing fails, try YAML
      try {
        logger.info('JSON parsing failed, attempting to parse as YAML...');
        const parsed = yaml.load(specString) as OpenAPISpec;
        logger.info('Successfully parsed YAML spec');
        return parsed;
      } catch (yamlError: any) {
        logger.error('Failed to parse spec as both JSON and YAML');
        logger.error('JSON error:', jsonError);
        logger.error('YAML error:', yamlError);
        throw new Error(
          `Failed to parse OpenAPI spec. Not valid JSON or YAML. JSON error: ${
            (jsonError as Error).message
          }, YAML error: ${yamlError.message}`
        );
      }
    }
  }

  /**
   * Parse OpenAPI spec and extract flows (no database operations)
   */
  async parseFlowsFromSpec(spec: OpenAPISpec | string): Promise<FlowPreview[]> {
    try {
      logger.info('Parsing OpenAPI spec for flows');

      // Parse spec if it's a string
      let parsedSpec: OpenAPISpec;
      if (typeof spec === 'string') {
        logger.info('Spec is a string, parsing...');
        parsedSpec = this.parseSpec(spec);
      } else {
        logger.info('Spec is already an object');
        parsedSpec = spec;
      }

      // Validate spec structure
      if (!parsedSpec.openapi && !parsedSpec['swagger']) {
        throw new Error('Invalid OpenAPI spec: missing "openapi" or "swagger" field');
      }

      if (!parsedSpec.paths || Object.keys(parsedSpec.paths).length === 0) {
        throw new Error('Invalid OpenAPI spec: no paths defined');
      }

      logger.info(`OpenAPI version: ${parsedSpec.openapi || parsedSpec['swagger']}`);
      logger.info(`API title: ${parsedSpec.info?.title || 'N/A'}`);
      logger.info(`Found ${Object.keys(parsedSpec.paths).length} paths`);

      // Extract flows from spec
      const flows = this.extractFlows(parsedSpec);
      logger.info(`Extracted ${flows.length} flows from OpenAPI spec`);

      if (flows.length === 0) {
        throw new Error('No operations found in OpenAPI spec');
      }

      return flows;
    } catch (error: any) {
      logger.error('Error parsing OpenAPI spec for flows:', error);
      throw new Error(`Failed to parse OpenAPI spec: ${error.message}`);
    }
  }

  /**
   * Parse OpenAPI spec from URL
   */
  async parseFlowsFromUrl(url: string): Promise<FlowPreview[]> {
    try {
      logger.info(`Fetching OpenAPI spec from ${url}`);
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          Accept: 'application/json, application/yaml, text/yaml, */*',
        },
      });
      const spec = response.data;

      return await this.parseFlowsFromSpec(spec);
    } catch (error: any) {
      logger.error('Error fetching OpenAPI spec from URL:', error);
      throw new Error(`Failed to fetch OpenAPI spec: ${error.message}`);
    }
  }

  /**
   * Extract flows from OpenAPI spec
   */
  private extractFlows(spec: OpenAPISpec): FlowPreview[] {
    const flows: FlowPreview[] = [];

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

      for (const method of methods) {
        if (pathItem[method]) {
          const operation = pathItem[method];
          
          // Generate flow name from operationId or path
          let flowName = operation.operationId || operation.summary || '';
          if (!flowName) {
            // Generate name from method and path
            const pathSegments = path.split('/').filter(Boolean);
            const lastSegment = pathSegments[pathSegments.length - 1] || 'endpoint';
            flowName = `${method} ${lastSegment}`.replace(/[{}]/g, '');
          }

          // Extract description
          const description = operation.description || operation.summary || '';

          // Extract variables from parameters
          const vars = this.extractVariables(
            operation.parameters || [],
            pathItem.parameters || [],
            operation.requestBody
          );

          const flowData: FlowPreview = {
            name: flowName,
            description,
            url: path,
            method: method.toUpperCase(),
            vars,
          };

          flows.push(flowData);
        }
      }
    }

    return flows;
  }

  /**
   * Extract variables from parameters and request body
   */
  private extractVariables(
    operationParams: any[],
    pathParams: any[],
    requestBody?: any
  ): Array<{ name: string; type: string; mandatory: boolean }> {
    const variables: Array<{ name: string; type: string; mandatory: boolean }> = [];
    const allParams = [...pathParams, ...operationParams];

    // Extract from parameters (path, query, header)
    for (const param of allParams) {
      if (param.in === 'path' || param.in === 'query') {
        const type = this.mapSchemaToType(param.schema);
        variables.push({
          name: param.name,
          type,
          mandatory: param.required || param.in === 'path', // Path params are always required
        });
      }
    }

    // Extract from request body
    if (requestBody) {
      const isRequired = requestBody.required || false;
      
      // Check if it's a JSON body
      const jsonContent = requestBody.content?.['application/json'];
      if (jsonContent) {
        // If there's a schema, we can extract properties
        if (jsonContent.schema?.properties) {
          const requiredFields = jsonContent.schema.required || [];
          for (const [propName, propSchema] of Object.entries(jsonContent.schema.properties)) {
            const type = this.mapSchemaToType(propSchema as any);
            variables.push({
              name: propName,
              type,
              mandatory: requiredFields.includes(propName),
            });
          }
        } else {
          // Generic body parameter
          variables.push({
            name: 'body',
            type: 'json',
            mandatory: isRequired,
          });
        }
      }
    }

    return variables;
  }

  /**
   * Map OpenAPI schema type to flow variable type
   */
  private mapSchemaToType(schema: any): string {
    if (!schema) return 'string';

    const schemaType = schema.type || 'string';
    
    // Map OpenAPI types to flow types
    const typeMap: Record<string, string> = {
      string: 'string',
      number: 'number',
      integer: 'number',
      boolean: 'boolean',
      object: 'json',
      array: 'json',
    };

    return typeMap[schemaType] || 'string';
  }
}

export default new FlowOpenAPIImporterService();

