import prisma from '../config/database';
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

interface ImportedAction {
  operation: string;
  operationId?: string;
  displayName: string;
  description?: string;
  method: string;
  path: string;
  parameters: any;
  requestBody?: any;
  responses?: any;
}

export class OpenAPIImporterService {
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
        throw new Error(`Failed to parse OpenAPI spec. Not valid JSON or YAML. JSON error: ${(jsonError as Error).message}, YAML error: ${yamlError.message}`);
      }
    }
  }

  /**
   * Import OpenAPI spec and create connector actions
   */
  async importFromSpec(connectorId: number, spec: OpenAPISpec | string): Promise<{ actionsCreated: number; actions: any[] }> {
    try {
      logger.info(`Importing OpenAPI spec for connector ${connectorId}`);

      // Validate connector exists
      const connector = await prisma.connector.findUnique({
        where: { id: connectorId },
      });

      if (!connector) {
        throw new Error(`Connector ${connectorId} not found`);
      }

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

      // Extract operations from spec
      const operations = this.extractOperations(parsedSpec);
      logger.info(`Extracted ${operations.length} operations from OpenAPI spec`);

      if (operations.length === 0) {
        throw new Error('No operations found in OpenAPI spec');
      }

      // Create connector actions
      const createdActions = [];
      for (const operation of operations) {
        try {
          const action = await this.createConnectorAction(connectorId, operation);
          createdActions.push(action);
        } catch (error: any) {
          logger.error(`Error creating action for ${operation.operation}:`, error);
          // Continue with other actions
        }
      }

      // Update connector with OpenAPI spec
      await prisma.connector.update({
        where: { id: connectorId },
        data: { openApiSpec: parsedSpec as any },
      });

      logger.info(`Successfully created ${createdActions.length} connector actions`);
      return {
        actionsCreated: createdActions.length,
        actions: createdActions,
      };
    } catch (error: any) {
      logger.error('Error importing OpenAPI spec:', error);
      throw new Error(`Failed to import OpenAPI spec: ${error.message}`);
    }
  }

  /**
   * Import OpenAPI spec from URL
   */
  async importFromUrl(connectorId: number, url: string): Promise<{ actionsCreated: number; actions: any[] }> {
    try {
      logger.info(`Fetching OpenAPI spec from ${url}`);
      const response = await axios.get(url);
      const spec = response.data;

      return await this.importFromSpec(connectorId, spec);
    } catch (error: any) {
      logger.error('Error fetching OpenAPI spec from URL:', error);
      throw new Error(`Failed to fetch OpenAPI spec: ${error.message}`);
    }
  }

  /**
   * Extract operations from OpenAPI spec
   */
  private extractOperations(spec: OpenAPISpec): ImportedAction[] {
    const operations: ImportedAction[] = [];

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

      for (const method of methods) {
        if (pathItem[method]) {
          const operation = pathItem[method];
          const operationData: ImportedAction = {
            operation: `${method.toUpperCase()} ${path}`,
            operationId: operation.operationId,
            displayName: operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`,
            description: operation.description,
            method: method.toUpperCase(),
            path: path,
            parameters: this.extractParameters(operation.parameters || [], pathItem.parameters || []),
            requestBody: operation.requestBody,
            responses: operation.responses,
          };

          operations.push(operationData);
        }
      }
    }

    return operations;
  }

  /**
   * Extract and normalize parameters
   */
  private extractParameters(operationParams: any[], pathParams: any[]): any {
    const allParams = [...pathParams, ...operationParams];
    const parameters: any = {
      path: [],
      query: [],
      header: [],
      body: null,
    };

    for (const param of allParams) {
      if (param.in === 'path') {
        parameters.path.push({
          name: param.name,
          required: param.required || false,
          schema: param.schema,
          description: param.description,
        });
      } else if (param.in === 'query') {
        parameters.query.push({
          name: param.name,
          required: param.required || false,
          schema: param.schema,
          description: param.description,
        });
      } else if (param.in === 'header') {
        parameters.header.push({
          name: param.name,
          required: param.required || false,
          schema: param.schema,
          description: param.description,
        });
      }
    }

    return parameters;
  }

  /**
   * Create connector action in database
   */
  private async createConnectorAction(connectorId: number, operation: ImportedAction): Promise<any> {
    try {
      // Check if action already exists
      const existing = await prisma.connectorAction.findFirst({
        where: {
          connectorId,
          operation: operation.operation,
        },
      });

      if (existing) {
        // Update existing action
        return await prisma.connectorAction.update({
          where: { id: existing.id },
          data: {
            operationId: operation.operationId,
            displayName: operation.displayName,
            description: operation.description,
            method: operation.method,
            path: operation.path,
            parameters: operation.parameters as any,
            requestBody: operation.requestBody as any,
            responses: operation.responses as any,
          },
        });
      } else {
        // Create new action
        return await prisma.connectorAction.create({
          data: {
            connectorId,
            operation: operation.operation,
            operationId: operation.operationId,
            displayName: operation.displayName,
            description: operation.description,
            method: operation.method,
            path: operation.path,
            parameters: operation.parameters as any,
            requestBody: operation.requestBody as any,
            responses: operation.responses as any,
          },
        });
      }
    } catch (error: any) {
      logger.error(`Error creating connector action:`, error);
      throw error;
    }
  }

  /**
   * Get connector actions
   */
  async getConnectorActions(connectorId: number): Promise<any[]> {
    try {
      return await prisma.connectorAction.findMany({
        where: {
          connectorId,
          isActive: true,
        },
        orderBy: {
          displayName: 'asc',
        },
      });
    } catch (error: any) {
      logger.error('Error getting connector actions:', error);
      throw error;
    }
  }

  /**
   * Delete all connector actions
   */
  async deleteConnectorActions(connectorId: number): Promise<number> {
    try {
      const result = await prisma.connectorAction.deleteMany({
        where: { connectorId },
      });
      return result.count;
    } catch (error: any) {
      logger.error('Error deleting connector actions:', error);
      throw error;
    }
  }
}

export default new OpenAPIImporterService();

