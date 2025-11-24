import { ActionHandler } from '../ActionExecutor';
import { ExecutionContext } from '../ProcessExecutor';
import logger from '../../utils/logger';

/**
 * IF THEN ELSE Action
 * Conditional branching based on expression evaluation
 */
export class IfThenElseAction implements ActionHandler {
  async execute(inputData: any, config: any, context: ExecutionContext): Promise<any> {
    try {
      const { condition, trueValue, falseValue } = { ...inputData, ...config };

      if (condition === undefined) {
        throw new Error('condition is required');
      }

      // Evaluate condition
      const result = this.evaluateCondition(condition, inputData, context);

      logger.info(`IF THEN ELSE: condition evaluated to ${result}`);

      return {
        conditionResult: result,
        selectedValue: result ? trueValue : falseValue,
        branchTaken: result ? 'true' : 'false',
      };
    } catch (error: any) {
      logger.error('IF THEN ELSE action failed:', error);
      throw new Error(`Conditional evaluation failed: ${error.message}`);
    }
  }

  /**
   * Evaluate condition
   * Supports:
   * - boolean values directly
   * - simple comparisons: "{{value}} > 10"
   * - equality checks: "{{status}} === 'completed'"
   */
  private evaluateCondition(condition: any, data: any, context: any): boolean {
    // If already boolean, return it
    if (typeof condition === 'boolean') {
      return condition;
    }

    // If string, try to evaluate
    if (typeof condition === 'string') {
      // Simple variable interpolation and comparison
      const interpolated = this.interpolate(condition, { ...data, ...context });

      // Try to evaluate as expression
      try {
        // Very basic evaluation - in production, use a proper expression evaluator
        if (interpolated === 'true') return true;
        if (interpolated === 'false') return false;

        // Check for comparison operators
        if (interpolated.includes('===')) {
          const [left, right] = interpolated.split('===').map((s) => s.trim());
          return left === right;
        }

        if (interpolated.includes('!==')) {
          const [left, right] = interpolated.split('!==').map((s) => s.trim());
          return left !== right;
        }

        if (interpolated.includes('>=')) {
          const [left, right] = interpolated.split('>=').map((s) => parseFloat(s.trim()));
          return left >= right;
        }

        if (interpolated.includes('<=')) {
          const [left, right] = interpolated.split('<=').map((s) => parseFloat(s.trim()));
          return left <= right;
        }

        if (interpolated.includes('>')) {
          const [left, right] = interpolated.split('>').map((s) => parseFloat(s.trim()));
          return left > right;
        }

        if (interpolated.includes('<')) {
          const [left, right] = interpolated.split('<').map((s) => parseFloat(s.trim()));
          return left < right;
        }

        // Default: check if truthy
        return Boolean(interpolated);
      } catch (error) {
        logger.warn(`Failed to evaluate condition: ${condition}`, error);
        return false;
      }
    }

    // For other types, check truthiness
    return Boolean(condition);
  }

  private interpolate(template: string, data: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value: any = data;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return match;
        }
      }

      return value !== undefined ? String(value) : match;
    });
  }
}

