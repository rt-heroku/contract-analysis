import logger from '../../utils/logger';
import { ActionExecutor } from '../ActionExecutor';

export class ForEachAction {
  private actionExecutor: ActionExecutor;

  constructor(actionExecutor: ActionExecutor) {
    this.actionExecutor = actionExecutor;
  }

  async execute(config: any, input: any, context: any): Promise<any> {
    try {
      const { array, batchSize = 1, stopOnError = false } = config;
      const items = input[array] || input.items || [];

      if (!Array.isArray(items)) {
        throw new Error('FOR_EACH requires an array input');
      }

      logger.info(`FOR_EACH: Processing ${items.length} items with batch size ${batchSize}`);

      const results: any[] = [];
      const errors: any[] = [];

      // Process in batches
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (item, index) => {
            try {
              // Execute the nested action for each item
              const itemContext = {
                ...context,
                item,
                index: i + index,
                isFirst: i + index === 0,
                isLast: i + index === items.length - 1,
              };

              // If config has a subAction, execute it
              if (config.subAction) {
                return await this.actionExecutor.executeAction(
                  config.subAction,
                  item,
                  itemContext
                );
              }

              // Otherwise, return item with context
              return { item, index: i + index, context: itemContext };
            } catch (error: any) {
              logger.error(`FOR_EACH: Error processing item ${i + index}:`, error);
              if (stopOnError) {
                throw error;
              }
              errors.push({
                index: i + index,
                item,
                error: error.message,
              });
              return null;
            }
          })
        );

        results.push(...batchResults);
      }

      return {
        total: items.length,
        processed: results.filter(r => r !== null).length,
        results: results.filter(r => r !== null),
        errors,
        hasErrors: errors.length > 0,
      };
    } catch (error: any) {
      logger.error('FOR_EACH action error:', error);
      throw error;
    }
  }
}

