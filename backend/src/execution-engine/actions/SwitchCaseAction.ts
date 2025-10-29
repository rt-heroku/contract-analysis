import { ActionHandler } from '../ActionExecutor';
import { ExecutionContext } from '../ProcessExecutor';
import logger from '../../utils/logger';

/**
 * Switch Case Action - Multi-way branching based on expression value
 * 
 * Evaluates an expression and routes to the matching case branch.
 * Always includes a default branch for unmatched values.
 */
export class SwitchCaseAction implements ActionHandler {
  async execute(inputData: any, config: any, context: ExecutionContext): Promise<any> {
    const { expression, cases = [], defaultLabel = 'default' } = { ...inputData, ...config };

    try {
      // Evaluate the expression
      let expressionValue: any;
      
      if (typeof expression === 'function') {
        expressionValue = expression(inputData);
      } else if (typeof expression === 'string') {
        // Simple property path evaluation (e.g., "status", "user.role")
        expressionValue = this.evaluatePropertyPath(expression, inputData);
      } else {
        expressionValue = expression;
      }

      logger.info(`Switch Case: Evaluated expression to "${expressionValue}"`);

      // Find matching case
      let matchedCase: any = null;
      let branchTaken = defaultLabel;

      for (const caseItem of cases) {
        if (this.valuesMatch(expressionValue, caseItem.value)) {
          matchedCase = caseItem;
          branchTaken = caseItem.label || caseItem.value?.toString() || 'case';
          logger.info(`Switch Case: Matched case "${branchTaken}" with value "${caseItem.value}"`);
          break;
        }
      }

      if (!matchedCase) {
        logger.info(`Switch Case: No match found, taking default branch "${defaultLabel}"`);
      }

      return {
        expressionValue,
        matchedCase: matchedCase || { value: null, label: defaultLabel },
        branchTaken,
        shouldContinue: true,
      };
    } catch (error: any) {
      logger.error('Switch Case action failed:', error);
      throw new Error(`Switch Case execution failed: ${error.message}`);
    }
  }

  /**
   * Evaluate property path like "user.role" or "status"
   */
  private evaluatePropertyPath(path: string, data: any): any {
    const parts = path.split('.');
    let value = data;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * Compare two values for equality
   * Supports strict and loose comparison
   */
  private valuesMatch(a: any, b: any): boolean {
    // Strict equality
    if (a === b) return true;

    // Type coercion for common cases
    if (a == b) return true;

    // Array comparison
    if (Array.isArray(a) && Array.isArray(b)) {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    // Object comparison
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return false;
  }
}

