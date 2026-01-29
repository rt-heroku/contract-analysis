import { StepHandler } from './StepHandler.interface';
import prisma from '../../config/database';
import logger from '../../utils/logger';

/**
 * File Upload Handler
 * 
 * Handles file upload and validation steps
 */
export class FileUploadHandler implements StepHandler {
  requiresUserInput(): boolean {
    return true; // User needs to upload file
  }

  getModalComponent(): string | null {
    return 'FileUploadModal';
  }

  async execute(stepConfig: any, inputData: any, context: any, userId: number): Promise<any> {
    try {
      // Validate file from user input
      const { fileId, filename, fileType, fileSize, fileContentBase64 } = inputData;

      if (!fileContentBase64) {
        throw new Error('No file provided');
      }

      // Validate file type if configured
      if (stepConfig.acceptedFileTypes && stepConfig.acceptedFileTypes.length > 0) {
        const accepted = stepConfig.acceptedFileTypes.some((type: string) =>
          fileType.toLowerCase().includes(type.toLowerCase())
        );
        if (!accepted) {
          throw new Error(`File type ${fileType} not accepted. Accepted types: ${stepConfig.acceptedFileTypes.join(', ')}`);
        }
      }

      // Validate file size if configured
      if (stepConfig.maxFileSize && fileSize > stepConfig.maxFileSize) {
        throw new Error(`File size ${fileSize} exceeds maximum ${stepConfig.maxFileSize} bytes`);
      }

      // Store file in database if not already stored
      let upload;
      if (fileId) {
        upload = await prisma.upload.findUnique({ where: { id: fileId } });
      }

      if (!upload) {
        const jobId = context.jobId || `workflow_${Date.now()}`;
        upload = await prisma.upload.create({
          data: {
            userId,
            jobId,
            filename,
            fileType,
            fileSize,
            mimeType: fileType,
            fileContentBase64,
            uploadType: 'workflow',
          },
        });
      }

      logger.info(`File uploaded in workflow: ${upload.id}`);

      return {
        fileId: upload.id,
        filename: upload.filename,
        fileType: upload.fileType,
        fileSize: upload.fileSize,
        jobId: upload.jobId,
      };
    } catch (error: any) {
      logger.error('Error in FileUploadHandler:', error);
      throw error;
    }
  }
}








