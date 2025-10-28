import logger from '../../utils/logger';
import { ActionExecutor } from '../ActionExecutor';

export class ParallelAction {
  private actionExecutor: ActionExecutor;

  constructor(actionExecutor: ActionExecutor) {
    this.actionExecutor = actionExecutor;
  }

  async execute(config: any, input: any, context: any): Promise<any> {
    try {
      const { actions = [], failFast = false, timeout = 30000 } = config;

      if (!Array.isArray(actions) || actions.length === 0) {
        throw new Error('PARALLEL requires an array of actions to execute');
      }

      logger.info(`PARALLEL: Executing ${actions.length} actions in parallel`);

      const startTime = Date.now();
      const results: any[] = [];
      const errors: any[] = [];

      // Execute all actions in parallel
      const promises = actions.map(async (action: any, index: number) => {
        try {
          const actionContext = {
            ...context,
            parallelIndex: index,
            parallelTotal: actions.length,
          };

          const result = await this.executeWithTimeout(
            () => this.actionExecutor.executeAction(action, input, actionContext),
            timeout
          );

          return { success: true, index, result };
        } catch (error: any) {
          logger.error(`PARALLEL: Error in action ${index}:`, error);
          
          if (failFast) {
            throw error;
          }

          return {
            success: false,
            index,
            error: error.message,
          };
        }
      });

      // Wait for all promises
      const settledResults = await Promise.allSettled(promises);

      settledResults.forEach((settled, index) => {
        if (settled.status === 'fulfilled') {
          const value = settled.value;
          if (value.success) {
            results.push(value.result);
          } else {
            errors.push({
              index: value.index,
              error: value.error,
            });
          }
        } else {
          errors.push({
            index,
            error: settled.reason?.message || 'Unknown error',
          });
        }
      });

      const duration = Date.now() - startTime;

      return {
        total: actions.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors,
        duration,
        hasErrors: errors.length > 0,
      };
    } catch (error: any) {
      logger.error('PARALLEL action error:', error);
      throw error;
    }
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }
}

