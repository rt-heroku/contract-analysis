import logger from '../../utils/logger';
import { ActionExecutor } from '../ActionExecutor';

export class WhileAction {
  private actionExecutor: ActionExecutor;

  constructor(actionExecutor: ActionExecutor) {
    this.actionExecutor = actionExecutor;
  }

  async execute(config: any, input: any, context: any): Promise<any> {
    try {
      const { maxIterations = 100, condition, delayBetweenIterations = 0 } = config;
      
      logger.info(`WHILE: Starting loop with max iterations ${maxIterations}`);

      const results: any[] = [];
      let iterations = 0;
      let continueLoop = true;

      while (continueLoop && iterations < maxIterations) {
        iterations++;

        // Evaluate condition
        const shouldContinue = this.evaluateCondition(condition, input, context, results);
        
        if (!shouldContinue) {
          logger.info(`WHILE: Condition false after ${iterations} iterations`);
          break;
        }

        // Execute the action
        try {
          const iterationContext = {
            ...context,
            iteration: iterations,
            previousResults: results,
          };

          let result;
          if (config.subAction) {
            result = await this.actionExecutor.executeAction(
              config.subAction,
              input,
              iterationContext
            );
          } else {
            result = { iteration: iterations, input, context: iterationContext };
          }

          results.push(result);

          // Optional delay between iterations
          if (delayBetweenIterations > 0) {
            await this.delay(delayBetweenIterations);
          }

        } catch (error: any) {
          logger.error(`WHILE: Error in iteration ${iterations}:`, error);
          throw error;
        }
      }

      if (iterations >= maxIterations) {
        logger.warn(`WHILE: Reached maximum iterations (${maxIterations})`);
      }

      return {
        iterations,
        results,
        completed: iterations < maxIterations,
        maxIterationsReached: iterations >= maxIterations,
      };
    } catch (error: any) {
      logger.error('WHILE action error:', error);
      throw error;
    }
  }

  private evaluateCondition(
    condition: string,
    input: any,
    context: any,
    previousResults: any[]
  ): boolean {
    try {
      // Simple condition evaluation
      // Supports: "input.value > 0", "context.counter < 10", etc.
      
      if (!condition) {
        return true; // No condition means continue
      }

      // Create evaluation context
      const evalContext = {
        input,
        context,
        previousResults,
        lastResult: previousResults[previousResults.length - 1],
      };

      // Safe eval using Function constructor
      const func = new Function('ctx', `
        with(ctx) {
          return ${condition};
        }
      `);

      return func(evalContext);
    } catch (error: any) {
      logger.error('Error evaluating WHILE condition:', error);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

