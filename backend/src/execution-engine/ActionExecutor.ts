import prisma from '../config/database';
import logger from '../utils/logger';
import { ExecutionContext } from './ProcessExecutor';
import axios from 'axios';

// Import built-in action handlers
import { IdpExtractAction } from './actions/IdpExtractAction';
import { RestApiCallAction } from './actions/RestApiCallAction';
import { SaveFileAction } from './actions/SaveFileAction';
import { IfThenElseAction } from './actions/IfThenElseAction';
import { TransformAction } from './actions/TransformAction';
import { ForEachAction } from './actions/ForEachAction';
import { WhileAction } from './actions/WhileAction';
import { ParallelAction } from './actions/ParallelAction';
import { ValidateAction } from './actions/ValidateAction';
import { MergeAction } from './actions/MergeAction';
import { ScriptAction } from './actions/ScriptAction';

export interface ActionHandler {
  execute(inputData: any, config: any, context: ExecutionContext): Promise<any>;
}

export class ActionExecutor {
  private actionHandlers: Map<string, ActionHandler>;

  constructor() {
    this.actionHandlers = new Map();
    this.registerBuiltInActions();
  }

  /**
   * Register built-in action handlers
   */
  private registerBuiltInActions() {
    this.actionHandlers.set('idp_extract', new IdpExtractAction());
    this.actionHandlers.set('rest_api_call', new RestApiCallAction());
    this.actionHandlers.set('save_file', new SaveFileAction());
    this.actionHandlers.set('if_then_else', new IfThenElseAction());
    this.actionHandlers.set('transform', new TransformAction());
    this.actionHandlers.set('for_each', new ForEachAction(this));
    this.actionHandlers.set('while', new WhileAction(this));
    this.actionHandlers.set('parallel', new ParallelAction(this));
    this.actionHandlers.set('validate', new ValidateAction());
    this.actionHandlers.set('merge', new MergeAction());
    this.actionHandlers.set('script', new ScriptAction());
  }

  /**
   * Execute a sub-action (used by control flow actions)
   */
  async executeAction(action: any, inputData: any, context: ExecutionContext): Promise<any> {
    if (typeof action === 'number') {
      // Action ID passed
      return await this.execute(action, inputData, {}, context);
    } else if (typeof action === 'object' && action.actionId) {
      // Action config with actionId
      return await this.execute(action.actionId, inputData, action.config || {}, context);
    } else {
      throw new Error('Invalid action reference');
    }
  }

  /**
   * Execute an action
   */
  async execute(
    actionId: number,
    inputData: any,
    config: any,
    context: ExecutionContext
  ): Promise<any> {
    try {
      // Load action definition
      const action = await prisma.action.findUnique({
        where: { id: actionId },
      });

      if (!action) {
        throw new Error(`Action not found: ${actionId}`);
      }

      if (!action.isActive) {
        throw new Error(`Action is not active: ${action.name}`);
      }

      // Validate input against schema (TODO: implement JSON schema validation)
      // await this.validateInput(inputData, action.inputSchema);

      // Execute based on executor type
      let output: any;

      if (action.executorType === 'builtin') {
        // Use built-in handler
        output = await this.executeBuiltIn(action, inputData, config, context);
      } else if (action.executorType === 'rest_api') {
        // Execute REST API call
        output = await this.executeRestApi(action, inputData, config, context);
      } else if (action.executorType === 'script') {
        // Execute script (TODO: implement sandboxed script execution)
        output = await this.executeScript(action, inputData, config, context);
      } else {
        throw new Error(`Unknown executor type: ${action.executorType}`);
      }

      // Validate output against schema (TODO: implement JSON schema validation)
      // await this.validateOutput(output, action.outputSchema);

      return output;
    } catch (error: any) {
      logger.error(`Action execution failed: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Execute built-in action
   */
  private async executeBuiltIn(
    action: any,
    inputData: any,
    config: any,
    context: ExecutionContext
  ): Promise<any> {
    const handler = this.actionHandlers.get(action.name);

    if (!handler) {
      throw new Error(`No handler found for built-in action: ${action.name}`);
    }

    return await handler.execute(inputData, config, context);
  }

  /**
   * Execute REST API action
   */
  private async executeRestApi(
    action: any,
    inputData: any,
    config: any,
    context: ExecutionContext
  ): Promise<any> {
    const executorConfig = action.executorConfig;

    // Interpolate variables in URL, headers, and body
    const url = this.interpolate(executorConfig.url, { ...inputData, ...context });
    const method = executorConfig.method || 'POST';
    const headers = executorConfig.headers || {};
    const bodyTemplate = executorConfig.bodyTemplate;

    let body: any = inputData;
    if (bodyTemplate) {
      const bodyStr = this.interpolate(bodyTemplate, { ...inputData, ...context });
      body = JSON.parse(bodyStr);
    }

    logger.info(`Executing REST API: ${method} ${url}`);

    try {
      const response = await axios({
        method,
        url,
        headers,
        data: body,
        timeout: 30000,
      });

      return {
        status: response.status,
        headers: response.headers,
        data: response.data,
      };
    } catch (error: any) {
      logger.error(`REST API call failed: ${error.message}`);
      throw new Error(`REST API call failed: ${error.message}`);
    }
  }

  /**
   * Execute script action (sandboxed JavaScript)
   */
  private async executeScript(
    action: any,
    inputData: any,
    config: any,
    context: ExecutionContext
  ): Promise<any> {
    // TODO: Implement sandboxed script execution using vm2
    // For now, throw error
    throw new Error('Script execution not yet implemented');
  }

  /**
   * Interpolate variables in a string template
   * Supports {{variable}} syntax
   */
  private interpolate(template: string, data: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value: any = data;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return match; // Keep original if not found
        }
      }

      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Validate input data against JSON schema
   */
  private async validateInput(inputData: any, schema: any): Promise<void> {
    // TODO: Implement JSON schema validation using ajv
  }

  /**
   * Validate output data against JSON schema
   */
  private async validateOutput(outputData: any, schema: any): Promise<void> {
    // TODO: Implement JSON schema validation using ajv
  }
}

