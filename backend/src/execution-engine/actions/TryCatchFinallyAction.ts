import { ActionHandler } from '../ActionExecutor';
import { ExecutionContext } from '../ProcessExecutor';
import logger from '../../utils/logger';

/**
 * Try Catch Finally Action
 * Error handling with try, catch, and optional finally blocks
 */
export class TryCatchFinallyAction implements ActionHandler {
  async execute(inputData: any, config: any, context: ExecutionContext): Promise<any> {
    const {
      catchEnabled = true,
      finallyEnabled = false,
      propagateError = false,
      errorVariable = 'error',
    } = { ...inputData, ...config };

    let success = false;
    let error: any = null;
    let result: any = null;
    let branchTaken = 'try';

    try {
      // Execute try block
      logger.info('Try Catch Finally: Executing try block');
      branchTaken = 'try';
      
      // In a real implementation, this would execute the actions in the try branch
      // For now, we'll mark it as successful and return input data
      result = inputData;
      success = true;
      
      logger.info('Try Catch Finally: Try block completed successfully');
    } catch (err: any) {
      // Catch block
      error = err;
      success = false;
      
      if (catchEnabled) {
        logger.info('Try Catch Finally: Error caught, executing catch block', {
          errorMessage: err.message,
          errorType: err.type || err.name,
        });
        
        branchTaken = 'catch';
        
        // Make error available in context
        const catchInput = {
          ...inputData,
          [errorVariable]: {
            message: err.message,
            type: err.type || err.name,
            code: err.code,
            statusCode: err.statusCode,
            stack: err.stack,
          },
        };
        
        // In a real implementation, this would execute the actions in the catch branch
        result = catchInput;
      } else {
        logger.warn('Try Catch Finally: Catch disabled, propagating error');
        throw err;
      }
    } finally {
      // Finally block - always executes
      if (finallyEnabled) {
        logger.info('Try Catch Finally: Executing finally block');
        branchTaken = success ? 'try' : 'catch';
        
        // In a real implementation, this would execute the actions in the finally branch
        // Finally block runs regardless of success or failure
      }
    }

    // Propagate error if configured
    if (propagateError && error) {
      logger.info('Try Catch Finally: Re-throwing error after catch');
      throw error;
    }

    return {
      success,
      error: error ? {
        message: error.message,
        type: error.type || error.name,
        code: error.code,
        statusCode: error.statusCode,
      } : null,
      result,
      branchTaken,
    };
  }
}

