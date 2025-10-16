import prisma from '../config/database';
import muleSoftService from './muleSoft.service';
import notificationService from './notification.service';
import logger from '../utils/logger';
import { ANALYSIS_STATUS, NOTIFICATION_TYPES } from '../utils/constants';
import { ProcessingResult } from '../types';

class DocumentService {
  /**
   * Start document processing workflow - STEP 1 ONLY (IDP processing)
   */
  async startProcessing(
    userId: number,
    contractUploadId: number,
    dataUploadId: number,
    prompt?: { id: number; name: string },
    variables?: Record<string, any>
  ): Promise<ProcessingResult> {
    try {
      // Get uploads to retrieve jobId
      const contractUpload = await prisma.upload.findUnique({ 
        where: { id: contractUploadId },
        select: { jobId: true }
      });

      if (!contractUpload) {
        throw new Error('Contract upload not found');
      }

      // Create analysis record with jobId
      const analysisRecord = await prisma.analysisRecord.create({
        data: {
          userId,
          jobId: contractUpload.jobId,
          contractUploadId,
          dataUploadId,
          status: ANALYSIS_STATUS.PROCESSING,
        },
      });

      // Start ONLY Step 1 (contract processing) asynchronously
      this.processContractOnly(userId, contractUploadId, analysisRecord.id, contractUpload.jobId)
        .catch((error) => {
          logger.error('Contract document processing failed:', error);
        });

      return {
        success: true,
        analysisRecordId: analysisRecord.id,
      };
    } catch (error: any) {
      logger.error('Failed to start processing:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process documents (async)
   */
  private async processDocuments(
    userId: number,
    contractUploadId: number,
    dataUploadId: number,
    analysisRecordId: number,
    jobId: string,
    prompt?: { id: number; name: string },
    variables?: Record<string, any>
  ): Promise<void> {
    try {
      // Get upload files
      const [contractUpload, dataUpload] = await Promise.all([
        prisma.upload.findUnique({ where: { id: contractUploadId } }),
        prisma.upload.findUnique({ where: { id: dataUploadId } }),
      ]);

      if (!contractUpload || !dataUpload) {
        throw new Error('Upload files not found');
      }

      // Step 1: Process contract document
      logger.info(`[Step 1/2] Processing contract document for jobId: ${jobId}`);
      let contractResult;
      try {
        contractResult = await muleSoftService.processContractDocument(
          jobId,
          userId,
          contractUploadId
        );
        logger.info(`[Step 1/2] Contract processing successful for jobId: ${jobId}`);
      } catch (error: any) {
        logger.error(`[Step 1/2] Contract processing FAILED for jobId: ${jobId}. Stopping analysis.`, { error: error.message });
        throw error; // Re-throw to outer catch block
      }

      // Save contract analysis
      const contractAnalysis = await prisma.contractAnalysis.create({
        data: {
          uploadId: contractUploadId,
          jobId,
          documentName: contractResult.documentName || contractResult.document || 'Unknown Document',
          status: contractResult.status,
          terms: contractResult.terms || [],
          products: contractResult.products || [],
          mulesoftResponse: contractResult,
        },
      });

      // Update analysis record
      await prisma.analysisRecord.update({
        where: { id: analysisRecordId },
        data: {
          contractAnalysisId: contractAnalysis.id,
        },
      });

      // Step 2: Analyze data with contract context
      logger.info(`[Step 2/2] Running final analysis for jobId: ${jobId}`);
      logger.info(`Passing contract result to /analyze endpoint`);
      if (prompt) {
        logger.info(`Using prompt: ${prompt.name} (ID: ${prompt.id})`);
      }
      let dataResult;
      try {
        dataResult = await muleSoftService.analyzeDataFile(
          jobId,
          userId,
          contractAnalysis.id,
          contractResult,
          prompt,
          variables
        );
        logger.info(`[Step 2/2] Analysis successful for jobId: ${jobId}`);
      } catch (error: any) {
        logger.error(`[Step 2/2] Analysis FAILED for jobId: ${jobId}`, { error: error.message });
        throw error; // Re-throw to outer catch block
      }
      // Save data analysis
      const dataAnalysis = await prisma.dataAnalysis.create({
        data: {
          contractAnalysisId: contractAnalysis.id,
          jobId,
          analysisMarkdown: dataResult.analysis_markdown,
          dataTable: dataResult.data_table || [],
          mulesoftResponse: dataResult,
        },
      });

      // Update analysis record as completed
      await prisma.analysisRecord.update({
        where: { id: analysisRecordId },
        data: {
          dataAnalysisId: dataAnalysis.id,
          status: ANALYSIS_STATUS.COMPLETED,
        },
      });

      // Send success notification
      await notificationService.createNotification({
        userId,
        title: 'Document Processing Complete',
        message: `Your analysis for ${contractUpload.filename} is ready`,
        type: NOTIFICATION_TYPES.SUCCESS,
        actionUrl: `/analysis/${analysisRecordId}`,
        relatedRecordType: 'analysis_record',
        relatedRecordId: analysisRecordId,
      });

      logger.info(`Processing completed for analysis record ${analysisRecordId}`);
    } catch (error: any) {
      logger.error('❌ Document processing FAILED - Analysis stopped', error);

      // Determine which step failed and create appropriate error message
      let errorMessage = 'Failed to process documents. Please try again.';
      let errorDetails = error.message || 'Unknown error';
      let errorStep = 'Unknown step';
      
      if (error.message?.includes('MuleSoft API Error')) {
        errorMessage = 'MuleSoft service is currently unavailable. Please check if the service is running and try again.';
        
        // Determine which step failed based on stack trace or error context
        if (error.stack?.includes('processContractDocument')) {
          errorStep = 'Step 1/2 - Contract Document Processing';
        } else if (error.stack?.includes('analyzeDataFile')) {
          errorStep = 'Step 2/2 - Data Analysis';
        }
        
        if (error.message.includes('ECONNREFUSED')) {
          errorDetails = `Connection refused - MuleSoft service is not running or not reachable (${errorStep})`;
        } else if (error.message.includes('timeout')) {
          errorDetails = `Request timeout - MuleSoft service took too long to respond (${errorStep})`;
        } else if (error.message.includes('ENOTFOUND')) {
          errorDetails = `DNS error - MuleSoft service hostname could not be resolved (${errorStep})`;
        } else {
          errorDetails = `${error.message} (${errorStep})`;
        }
      }
      
      logger.error(`Error details: ${errorDetails}`);

      // Update analysis record as failed with error details
      await prisma.analysisRecord.update({
        where: { id: analysisRecordId },
        data: {
          status: ANALYSIS_STATUS.FAILED,
          errorMessage: errorDetails,
        },
      });

      // Send error notification
      await notificationService.createNotification({
        userId,
        title: 'Processing Error',
        message: errorMessage,
        type: NOTIFICATION_TYPES.ERROR,
        actionUrl: '/processing',
        relatedRecordType: 'analysis_record',
        relatedRecordId: analysisRecordId,
      });
    }
  }

  /**
   * STEP 1: Process contract document only (IDP processing)
   */
  private async processContractOnly(
    userId: number,
    contractUploadId: number,
    analysisRecordId: number,
    jobId: string
  ): Promise<void> {
    try {
      // Get contract upload file
      const contractUpload = await prisma.upload.findUnique({ 
        where: { id: contractUploadId } 
      });

      if (!contractUpload) {
        throw new Error('Contract upload file not found');
      }

      // Step 1: Process contract document via MuleSoft IDP
      logger.info(`[Step 1/2] Processing contract document for jobId: ${jobId}`);
      let contractResult;
      try {
        contractResult = await muleSoftService.processContractDocument(
          jobId,
          userId,
          contractUploadId
        );
        logger.info(`[Step 1/2] Contract processing successful for jobId: ${jobId}`);
      } catch (error: any) {
        logger.error(`[Step 1/2] Contract processing FAILED for jobId: ${jobId}`, { error: error.message });
        throw error;
      }

      // Save contract analysis
      const contractAnalysis = await prisma.contractAnalysis.create({
        data: {
          uploadId: contractUploadId,
          jobId,
          documentName: contractResult.documentName || contractResult.document || 'Unknown Document',
          status: contractResult.status,
          terms: contractResult.terms || [],
          products: contractResult.products || [],
          mulesoftResponse: contractResult,
        },
      });

      // Update analysis record with contract analysis ID and mark as IDP_COMPLETED
      await prisma.analysisRecord.update({
        where: { id: analysisRecordId },
        data: {
          contractAnalysisId: contractAnalysis.id,
          status: 'IDP_COMPLETED', // Intermediate status - IDP done, analysis pending
        },
      });

      // Send notification that Step 1 is complete
      await notificationService.createNotification({
        userId,
        title: 'Document Processing Complete',
        message: 'IDP has extracted data from your contract. Ready for analysis.',
        type: NOTIFICATION_TYPES.SUCCESS,
        actionUrl: `/idp-response/${analysisRecordId}`,
        relatedRecordType: 'analysis_record',
        relatedRecordId: analysisRecordId,
      });

    } catch (error: any) {
      logger.error('Contract processing error:', error);

      let errorMessage = 'Failed to process contract document';
      let errorDetails = error.message;

      if (error.message?.includes('MuleSoft API Error')) {
        errorMessage = 'MuleSoft IDP service is currently unavailable.';
        
        if (error.message.includes('ECONNREFUSED')) {
          errorDetails = 'Connection refused - MuleSoft service is not running';
        } else if (error.message.includes('timeout')) {
          errorDetails = 'Request timeout - MuleSoft service took too long';
        }
      }

      // Update analysis record as failed
      await prisma.analysisRecord.update({
        where: { id: analysisRecordId },
        data: {
          status: ANALYSIS_STATUS.FAILED,
          errorMessage: errorDetails,
        },
      });

      // Send error notification
      await notificationService.createNotification({
        userId,
        title: 'Document Processing Failed',
        message: errorMessage,
        type: NOTIFICATION_TYPES.ERROR,
        actionUrl: '/processing',
        relatedRecordType: 'analysis_record',
        relatedRecordId: analysisRecordId,
      });
    }
  }

  /**
   * STEP 2: Run analysis with contract context
   */
  async runAnalysis(
    userId: number,
    analysisRecordId: number,
    prompt?: { id: number; name: string },
    variables?: Record<string, any>
  ): Promise<ProcessingResult> {
    try {
      // Get the analysis record
      const analysisRecord = await prisma.analysisRecord.findUnique({
        where: { id: analysisRecordId },
        include: {
          contractAnalysis: true,
        },
      });

      if (!analysisRecord) {
        throw new Error('Analysis record not found');
      }

      if (!analysisRecord.contractAnalysis) {
        throw new Error('Contract analysis not found. Please run Step 1 first.');
      }

      // Update status to processing
      await prisma.analysisRecord.update({
        where: { id: analysisRecordId },
        data: { status: ANALYSIS_STATUS.PROCESSING },
      });

      // Run analysis asynchronously
      this.performAnalysis(
        userId,
        analysisRecordId,
        analysisRecord.contractAnalysisId!,
        analysisRecord.jobId,
        analysisRecord.contractAnalysis.mulesoftResponse,
        prompt,
        variables
      ).catch((error) => {
        logger.error('Analysis failed:', error);
      });

      return {
        success: true,
        analysisRecordId,
      };
    } catch (error: any) {
      logger.error('Failed to start analysis:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Perform the actual analysis (Step 2 processing)
   */
  private async performAnalysis(
    userId: number,
    analysisRecordId: number,
    contractAnalysisId: number,
    jobId: string,
    contractResult: any,
    prompt?: { id: number; name: string },
    variables?: Record<string, any>
  ): Promise<void> {
    try {
      // Step 2: Analyze data with contract context
      logger.info(`[Step 2/2] Running final analysis for jobId: ${jobId}`);
      logger.info(`Passing contract result to /analyze endpoint`);
      if (prompt) {
        logger.info(`Using prompt: ${prompt.name} (ID: ${prompt.id})`);
      }

      let dataResult;
      try {
        dataResult = await muleSoftService.analyzeDataFile(
          jobId,
          userId,
          contractAnalysisId,
          contractResult,
          prompt,
          variables
        );
        logger.info(`[Step 2/2] Analysis successful for jobId: ${jobId}`);
      } catch (error: any) {
        logger.error(`[Step 2/2] Analysis FAILED for jobId: ${jobId}`, { error: error.message });
        throw error;
      }

      // Save data analysis
      const dataAnalysis = await prisma.dataAnalysis.create({
        data: {
          contractAnalysisId,
          jobId,
          analysisMarkdown: dataResult.analysis_markdown,
          dataTable: dataResult.data_table || [],
          mulesoftResponse: dataResult,
        },
      });

      // Update analysis record as completed
      await prisma.analysisRecord.update({
        where: { id: analysisRecordId },
        data: {
          status: ANALYSIS_STATUS.COMPLETED,
          dataAnalysisId: dataAnalysis.id,
        },
      });

      // Send success notification
      await notificationService.createNotification({
        userId,
        title: 'Analysis Complete',
        message: 'Your document analysis has been completed successfully',
        type: NOTIFICATION_TYPES.SUCCESS,
        actionUrl: `/analysis/${analysisRecordId}`,
        relatedRecordType: 'analysis_record',
        relatedRecordId: analysisRecordId,
      });

    } catch (error: any) {
      logger.error('Analysis error:', error);

      let errorMessage = 'Failed to complete analysis';
      let errorDetails = error.message;

      if (error.message?.includes('MuleSoft API Error')) {
        errorMessage = 'MuleSoft analysis service is currently unavailable.';
        
        if (error.message.includes('ECONNREFUSED')) {
          errorDetails = 'Connection refused - MuleSoft service is not running';
        } else if (error.message.includes('timeout')) {
          errorDetails = 'Request timeout - Analysis took too long';
        }
      }

      // Update analysis record as failed
      await prisma.analysisRecord.update({
        where: { id: analysisRecordId },
        data: {
          status: ANALYSIS_STATUS.FAILED,
          errorMessage: errorDetails,
        },
      });

      // Send error notification
      await notificationService.createNotification({
        userId,
        title: 'Analysis Failed',
        message: errorMessage,
        type: NOTIFICATION_TYPES.ERROR,
        actionUrl: `/idp-response/${analysisRecordId}`,
        relatedRecordType: 'analysis_record',
        relatedRecordId: analysisRecordId,
      });
    }
  }

  /**
   * Get analysis record by ID
   */
  async getAnalysisById(analysisRecordId: number, userId?: number) {
    const where: any = { id: analysisRecordId, isDeleted: false };
    if (userId) {
      where.userId = userId;
    }

    const analysis = await prisma.analysisRecord.findUnique({
      where,
      include: {
        contractUpload: true,
        dataUpload: true,
        contractAnalysis: true,
        dataAnalysis: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return analysis;
  }

  /**
   * Get user analysis history
   */
  async getUserAnalysisHistory(
    userId: number,
    page: number = 1,
    limit: number = 20,
    search?: string
  ) {
    const skip = (page - 1) * limit;

    // Build where clause for owned analyses
    const ownedWhere: any = {
      userId,
      isDeleted: false,
    };

    if (search) {
      ownedWhere.OR = [
        { contractUpload: { filename: { contains: search, mode: 'insensitive' } } },
        { dataUpload: { filename: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Fetch owned analyses
    const ownedAnalyses = await prisma.analysisRecord.findMany({
      where: ownedWhere,
      include: {
        contractUpload: {
          select: {
            filename: true,
            createdAt: true,
          },
        },
        dataUpload: {
          select: {
            filename: true,
          },
        },
        contractAnalysis: {
          select: {
            terms: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all non-deleted analyses to check for shared ones
    const allAnalyses = await prisma.analysisRecord.findMany({
      where: {
        isDeleted: false,
        NOT: { userId }, // Exclude owned analyses
      },
      include: {
        contractUpload: {
          select: {
            filename: true,
            createdAt: true,
          },
        },
        dataUpload: {
          select: {
            filename: true,
          },
        },
        contractAnalysis: {
          select: {
            terms: true,
          },
        },
      },
    });

    // Filter analyses shared with this user
    const sharedAnalyses = allAnalyses.filter((analysis: any) => {
      const sharedWith = Array.isArray(analysis.sharedWith) 
        ? analysis.sharedWith 
        : [];
      return sharedWith.includes(userId);
    });

    // Apply search filter to shared analyses
    let filteredSharedAnalyses = sharedAnalyses;
    if (search) {
      filteredSharedAnalyses = sharedAnalyses.filter((analysis: any) => {
        const contractMatch = analysis.contractUpload?.filename?.toLowerCase().includes(search.toLowerCase());
        const dataMatch = analysis.dataUpload?.filename?.toLowerCase().includes(search.toLowerCase());
        return contractMatch || dataMatch;
      });
    }

    // Combine and sort by createdAt
    const allUserAnalyses = [...ownedAnalyses, ...filteredSharedAnalyses].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate
    const total = allUserAnalyses.length;
    const analyses = allUserAnalyses.slice(skip, skip + limit);

    // Fetch shared user details for each analysis
    const analysesWithSharedUsers = await Promise.all(
      analyses.map(async (analysis: any) => {
        if (analysis.sharedWith && analysis.sharedWith.length > 0) {
          const sharedUsers = await prisma.user.findMany({
            where: {
              id: { in: analysis.sharedWith },
            },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          });
          return { ...analysis, sharedUsers };
        }
        return analysis;
      })
    );

    return {
      analyses: analysesWithSharedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete analysis (admin - soft delete)
   */
  async deleteAnalysis(analysisRecordId: number, deletedBy: number): Promise<void> {
    await prisma.analysisRecord.update({
      where: { id: analysisRecordId },
      data: {
        isDeleted: true,
        deletedBy,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Get analysis statistics
   */
  async getStatistics(userId?: number) {
    const where: any = { isDeleted: false };
    if (userId) {
      where.userId = userId;
    }

    const [total, completed, processing, failed] = await Promise.all([
      prisma.analysisRecord.count({ where }),
      prisma.analysisRecord.count({
        where: { ...where, status: ANALYSIS_STATUS.COMPLETED },
      }),
      prisma.analysisRecord.count({
        where: { ...where, status: ANALYSIS_STATUS.PROCESSING },
      }),
      prisma.analysisRecord.count({
        where: { ...where, status: ANALYSIS_STATUS.FAILED },
      }),
    ]);

    return {
      total,
      completed,
      processing,
      failed,
    };
  }
}

export default new DocumentService();

