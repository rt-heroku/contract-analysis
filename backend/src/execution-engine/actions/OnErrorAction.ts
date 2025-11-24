import { ActionHandler } from '../ActionExecutor';
import { ExecutionContext } from '../ProcessExecutor';
import logger from '../../utils/logger';
import prisma from '../../config/database';

/**
 * On Error Action
 * Execute a separate error handling flow when errors occur
 */
export class OnErrorAction implements ActionHandler {
  async execute(inputData: any, config: any, context: ExecutionContext): Promise<any> {
    const {
      errorTypes = [],
      continueOnError = false,
      logError = true,
      notifyOnError = false,
    } = { ...inputData, ...config };

    // This action is designed to be attached to other actions or processes
    // It acts as an error handler that catches errors from previous actions

    // In this implementation, we'll assume this is being called because an error occurred
    const error = inputData.error || new Error('Unknown error');

    try {
      // Check if this error type should be handled
      const shouldHandle = this.shouldHandleError(error, errorTypes);

      if (!shouldHandle) {
        logger.info('On Error: Error type not handled, propagating', {
          errorType: error.type || error.name,
          allowedTypes: errorTypes,
        });
        throw error;
      }

      logger.info('On Error: Handling error', {
        errorType: error.type || error.name,
        errorMessage: error.message,
      });

      // Log error to activity logs if configured
      if (logError) {
        await this.logError(error, context);
      }

      // Send notification if configured
      if (notifyOnError) {
        await this.notifyError(error, context);
      }

      // Execute error handling flow
      // In a real implementation, this would execute the actions in the error handling branch

      return {
        error: {
          message: error.message,
          type: error.type || error.name,
          code: error.code,
          statusCode: error.statusCode,
          timestamp: new Date().toISOString(),
        },
        handled: true,
        originalInput: inputData,
        timestamp: new Date().toISOString(),
        continueOnError,
      };
    } catch (err: any) {
      logger.error('On Error: Error handler failed', err);
      
      // If continue on error is enabled, return gracefully
      if (continueOnError) {
        return {
          error: {
            message: err.message,
            type: err.type || err.name,
          },
          handled: false,
          originalInput: inputData,
          timestamp: new Date().toISOString(),
        };
      }
      
      throw err;
    }
  }

  /**
   * Check if error should be handled based on error types
   */
  private shouldHandleError(error: any, errorTypes: string[]): boolean {
    // If no error types specified, handle all errors
    if (!errorTypes || errorTypes.length === 0) {
      return true;
    }

    const errorType = error.type || error.name || 'Error';
    return errorTypes.some((type) => 
      errorType.toLowerCase().includes(type.toLowerCase())
    );
  }

  /**
   * Log error to activity logs
   */
  private async logError(error: any, context: ExecutionContext): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          userId: context.userId,
          processId: context.processId,
          actionId: context.actionId,
          logLevel: 'error',
          actionType: 'on_error',
          actionDescription: `Error caught: ${error.message}`,
          metadata: {
            error: {
              message: error.message,
              type: error.type || error.name,
              code: error.code,
              statusCode: error.statusCode,
              stack: error.stack,
            },
          } as any,
        },
      });

      logger.info('On Error: Error logged to activity logs');
    } catch (err) {
      logger.error('On Error: Failed to log error to activity logs', err);
    }
  }

  /**
   * Send error notification
   */
  private async notifyError(error: any, context: ExecutionContext): Promise<void> {
    // In a real implementation, this would send email/slack/webhook notifications
    logger.info('On Error: Error notification sent', {
      errorType: error.type || error.name,
      errorMessage: error.message,
      processId: context.processId,
    });
  }
}

