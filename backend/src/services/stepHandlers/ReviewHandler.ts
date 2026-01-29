import { StepHandler } from './StepHandler.interface';
import logger from '../../utils/logger';

/**
 * Review Handler
 * 
 * Pauses execution for manual review or conversational interaction
 */
export class ReviewHandler implements StepHandler {
  requiresUserInput(): boolean {
    return true; // Always requires user input
  }

  getModalComponent(): string | null {
    // Return the component specified in config, or default
    return 'ReviewModal';
  }

  async execute(stepConfig: any, inputData: any, context: any, userId: number): Promise<any> {
    try {
      // This handler is special - it doesn't execute anything
      // It just marks that user input is needed
      // The actual data will come from resumeExecution

      const reviewType = stepConfig.reviewType || 'manual';
      const dataToReview = inputData;

      logger.info(`Review step initiated: ${reviewType}`);

      // Return the data that needs to be reviewed
      // This will be shown to the user in the modal
      return {
        reviewType,
        dataToReview,
        requiresReview: true,
      };
    } catch (error: any) {
      logger.error('Error in ReviewHandler:', error);
      throw error;
    }
  }
}








