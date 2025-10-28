import { ActionHandler } from '../ActionExecutor';
import { ExecutionContext } from '../ProcessExecutor';
import prisma from '../../config/database';
import logger from '../../utils/logger';

/**
 * Save File Action
 * Saves file content to database or storage
 */
export class SaveFileAction implements ActionHandler {
  async execute(inputData: any, config: any, context: ExecutionContext): Promise<any> {
    try {
      const {
        fileName,
        fileContent,
        fileType = 'unknown',
        mimeType,
        storeType = 'database',
      } = { ...inputData, ...config };

      if (!fileName) {
        throw new Error('fileName is required');
      }

      if (!fileContent) {
        throw new Error('fileContent is required');
      }

      // For now, only support database storage
      if (storeType === 'database') {
        // Convert to base64 if not already
        const base64Content =
          typeof fileContent === 'string' && fileContent.includes('base64')
            ? fileContent
            : Buffer.from(fileContent).toString('base64');

        const fileSize = Buffer.from(base64Content, 'base64').length;

        // Create upload record
        const upload = await prisma.upload.create({
          data: {
            userId: context.userId as number,
            jobId: context.executionId as string,
            filename: fileName,
            fileType,
            fileSize,
            mimeType: mimeType || `application/${fileType}`,
            fileContentBase64: base64Content,
            uploadType: 'process_output',
          },
        });

        logger.info(`File saved: ${fileName} (ID: ${upload.id})`);

        return {
          success: true,
          fileId: upload.id,
          fileName,
          fileSize,
          storeType,
        };
      } else {
        throw new Error(`Store type not yet supported: ${storeType}`);
      }
    } catch (error: any) {
      logger.error('Save File action failed:', error);
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }
}

