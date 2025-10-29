import { ActionHandler } from '../ActionExecutor';
import { ExecutionContext } from '../ProcessExecutor';
import logger from '../../utils/logger';

/**
 * Raise Error Action
 * Throws a custom error to trigger error handling flows
 */
export class RaiseErrorAction implements ActionHandler {
  async execute(inputData: any, config: any, context: ExecutionContext): Promise<any> {
    const {
      errorMessage,
      errorCode,
      errorType = 'UserError',
      statusCode = 500,
      includeStackTrace = true,
    } = { ...inputData, ...config };

    try {
      // Create error object
      const error: any = new Error(errorMessage || 'An error occurred');
      error.code = errorCode;
      error.type = errorType;
      error.statusCode = statusCode;
      error.context = inputData;
      error.timestamp = new Date().toISOString();
      error.actionId = context.actionId;
      error.processId = context.processId;

      // Log the error
      logger.error(`Raise Error: ${errorType} - ${errorMessage}`, {
        code: errorCode,
        statusCode,
        context: inputData,
      });

      // Remove stack trace if not needed
      if (!includeStackTrace) {
        delete error.stack;
      }

      // Throw the error to be caught by error handlers
      throw error;
    } catch (error: any) {
      // Re-throw to propagate
      throw error;
    }
  }
}

