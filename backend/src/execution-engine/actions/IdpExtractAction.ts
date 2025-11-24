import { ActionHandler } from '../ActionExecutor';
import { ExecutionContext } from '../ProcessExecutor';
import prisma from '../../config/database';
import muleSoftService from '../../services/muleSoft.service';
import logger from '../../utils/logger';

/**
 * IDP Extract Action
 * Extracts data from documents using MuleSoft IDP
 */
export class IdpExtractAction implements ActionHandler {
  async execute(inputData: any, config: any, context: ExecutionContext): Promise<any> {
    try {
      const { idpExecutionId, file, fileName, documentType } = inputData;

      if (!idpExecutionId) {
        throw new Error('idpExecutionId is required');
      }

      if (!file) {
        throw new Error('file (base64) is required');
      }

      // Get IDP execution configuration
      const idpExecution = await prisma.idpExecution.findUnique({
        where: { id: idpExecutionId },
      });

      if (!idpExecution) {
        throw new Error(`IDP Execution not found: ${idpExecutionId}`);
      }

      if (!idpExecution.isActive) {
        throw new Error(`IDP Execution is not active: ${idpExecution.name}`);
      }

      // Generate jobId if not provided
      const jobId = config.jobId || `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Create upload record (optional, for tracking)
      let uploadId: number | undefined;
      if (context.userId) {
        const upload = await prisma.upload.create({
          data: {
            userId: context.userId as number,
            jobId,
            filename: fileName || 'document.pdf',
            fileType: documentType || 'pdf',
            fileSize: Buffer.from(file, 'base64').length,
            mimeType: 'application/pdf',
            fileContentBase64: file,
            uploadType: 'contract',
          },
        });
        uploadId = upload.id;
      }

      // Call MuleSoft IDP
      logger.info(`Calling MuleSoft IDP for jobId: ${jobId}`);

      const result = await muleSoftService.processContractDocument(
        jobId,
        context.userId as number,
        uploadId
      );

      logger.info(`IDP extraction completed for jobId: ${jobId}`);

      return {
        jobId,
        uploadId,
        extractedData: result.extractedData,
        status: result.status,
        documentName: fileName,
      };
    } catch (error: any) {
      logger.error('IDP Extract action failed:', error);
      throw new Error(`IDP extraction failed: ${error.message}`);
    }
  }
}

