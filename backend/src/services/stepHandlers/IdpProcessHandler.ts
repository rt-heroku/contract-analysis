import { StepHandler } from './StepHandler.interface';
import mulesoftService from '../muleSoft.service';
import logger from '../../utils/logger';

/**
 * IDP Process Handler
 * 
 * Calls MuleSoft IDP API to process documents
 */
export class IdpProcessHandler implements StepHandler {
  requiresUserInput(): boolean {
    return false;
  }

  getModalComponent(): string | null {
    return null;
  }

  async execute(stepConfig: any, inputData: any, context: any, userId: number): Promise<any> {
    try {
      const { fileId, fileContentBase64, filename, documentType } = inputData;

      if (!fileContentBase64) {
        throw new Error('No file content provided for IDP processing');
      }

      // Get IDP configuration from step config or use defaults
      const idpConfig = stepConfig.idpConfig || {};
      const docType = documentType || stepConfig.documentType || 'contract';

      // Call IDP API
      logger.info(`Processing document with IDP: ${filename || fileId}`);

      // Generate a job ID for this workflow step
      const jobId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Note: Using processContractDocument - adapt based on your MuleSoft service
      const idpResponse = await mulesoftService.processContractDocument(
        jobId,
        userId,
        fileId
      );

      // Check if manual review is needed
      if (idpResponse.status === 'MANUAL_REVIEW') {
        logger.info('IDP processing requires manual review');
        return {
          status: 'MANUAL_REVIEW',
          idpResponse,
          requiresReview: true,
        };
      }

      logger.info(`IDP processing completed: ${idpResponse.status}`);

      return {
        status: idpResponse.status,
        idpResponse,
        extractedData: idpResponse.extractedData || {},
        confidence: idpResponse.confidence,
      };
    } catch (error: any) {
      logger.error('Error in IdpProcessHandler:', error);
      throw error;
    }
  }
}

