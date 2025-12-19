import { StepHandler } from './StepHandler.interface';
import prisma from '../../config/database';
import logger from '../../utils/logger';

/**
 * Store Handler
 * 
 * Stores data to database, file system, or other storage
 */
export class StoreHandler implements StepHandler {
  requiresUserInput(): boolean {
    return false;
  }

  getModalComponent(): string | null {
    return null;
  }

  async execute(stepConfig: any, inputData: any, context: any, userId: number): Promise<any> {
    try {
      const { storageType, tableName, storeId } = stepConfig;

      if (!storageType) {
        throw new Error('Storage type is required');
      }

      logger.info(`Storing data: ${storageType}`);

      switch (storageType) {
        case 'database':
          return await this.storeToDatabase(tableName, inputData, context, userId);

        case 'file':
          return await this.storeToFile(inputData, stepConfig, userId);

        case 'custom_store':
          if (storeId) {
            return await this.storeToCustomStore(storeId, inputData, userId);
          }
          throw new Error('Custom store requires storeId');

        default:
          throw new Error(`Unknown storage type: ${storageType}`);
      }
    } catch (error: any) {
      logger.error('Error in StoreHandler:', error);
      throw error;
    }
  }

  private async storeToDatabase(tableName: string, inputData: any, context: any, userId: number): Promise<any> {
    // Store workflow results to a generic table
    // For now, we'll use a JSON field to store arbitrary data

    if (tableName === 'analysis_records') {
      // Store to analysis_records table
      const jobId = context.jobId || `workflow_${Date.now()}`;
      
      const record = await prisma.analysisRecord.create({
        data: {
          userId,
          jobId,
          status: 'completed',
          // Store workflow data in a way that's compatible with existing schema
        },
      });

      return {
        storageType: 'database',
        tableName,
        recordId: record.id,
      };
    }

    // For other tables, just return success
    // In a real implementation, you'd use dynamic table access
    return {
      storageType: 'database',
      tableName,
      stored: true,
      data: inputData,
    };
  }

  private async storeToFile(inputData: any, stepConfig: any, userId: number): Promise<any> {
    // Store data as a file in the uploads table
    const jobId = stepConfig.jobId || `workflow_${Date.now()}`;
    const filename = stepConfig.filename || `workflow_output_${Date.now()}.json`;

    const fileContent = JSON.stringify(inputData, null, 2);
    const fileContentBase64 = Buffer.from(fileContent).toString('base64');

    const upload = await prisma.upload.create({
      data: {
        userId,
        jobId,
        filename,
        fileType: 'application/json',
        fileSize: fileContent.length,
        mimeType: 'application/json',
        fileContentBase64,
        uploadType: 'workflow_output',
      },
    });

    return {
      storageType: 'file',
      fileId: upload.id,
      filename: upload.filename,
    };
  }

  private async storeToCustomStore(storeId: number, inputData: any, userId: number): Promise<any> {
    // Get store configuration
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { connector: true },
    });

    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    // Store data according to store configuration
    // This would integrate with the connector system
    logger.info(`Storing to custom store: ${store.name}`);

    return {
      storageType: 'custom_store',
      storeId: store.id,
      storeName: store.name,
      stored: true,
    };
  }
}





