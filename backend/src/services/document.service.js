"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const muleSoft_service_1 = __importDefault(require("./muleSoft.service"));
const notification_service_1 = __importDefault(require("./notification.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const constants_1 = require("../utils/constants");
const types_1 = require("../types");
class DocumentService {
    /**
     * Start document processing workflow
     */
    async startProcessing(userId, contractUploadId, dataUploadId) {
        try {
            // Get uploads to retrieve jobId
            const contractUpload = await database_1.default.upload.findUnique({
                where: { id: contractUploadId },
                select: { jobId: true }
            });
            if (!contractUpload) {
                throw new Error('Contract upload not found');
            }
            // Create analysis record with jobId
            const analysisRecord = await database_1.default.analysisRecord.create({
                data: {
                    userId,
                    jobId: contractUpload.jobId,
                    contractUploadId,
                    dataUploadId,
                    status: constants_1.ANALYSIS_STATUS.PROCESSING,
                },
            });
            // Start processing asynchronously
            this.processDocuments(userId, contractUploadId, dataUploadId, analysisRecord.id, contractUpload.jobId)
                .catch((error) => {
                logger_1.default.error('Document processing failed:', error);
            });
            return {
                success: true,
                analysisRecordId: analysisRecord.id,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to start processing:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Process documents (async)
     */
    async processDocuments(userId, contractUploadId, dataUploadId, analysisRecordId, jobId) {
        try {
            // Get upload files
            const [contractUpload, dataUpload] = await Promise.all([
                database_1.default.upload.findUnique({ where: { id: contractUploadId } }),
                database_1.default.upload.findUnique({ where: { id: dataUploadId } }),
            ]);
            if (!contractUpload || !dataUpload) {
                throw new Error('Upload files not found');
            }
            // Step 1: Process contract document
            logger_1.default.info(`Processing contract and data for jobId: ${jobId}`);
            const contractResult = await muleSoft_service_1.default.processContractDocument(jobId, userId, contractUploadId);
            // Save contract analysis
            const contractAnalysis = await database_1.default.contractAnalysis.create({
                data: {
                    uploadId: contractUploadId,
                    jobId,
                    documentName: contractResult.document,
                    status: contractResult.status,
                    terms: contractResult.terms || [],
                    products: contractResult.products || [],
                    mulesoftResponse: contractResult,
                },
            });
            // Update analysis record
            await database_1.default.analysisRecord.update({
                where: { id: analysisRecordId },
                data: {
                    contractAnalysisId: contractAnalysis.id,
                },
            });
            // Step 2: Analyze data with contract context
            logger_1.default.info(`Running final analysis for jobId: ${jobId}`);
            const dataResult = await muleSoft_service_1.default.analyzeDataFile(jobId, userId, contractAnalysis.id);
            // Save data analysis
            const dataAnalysis = await database_1.default.dataAnalysis.create({
                data: {
                    contractAnalysisId: contractAnalysis.id,
                    jobId,
                    analysisMarkdown: dataResult.analysis_markdown,
                    dataTable: dataResult.data_table || [],
                    mulesoftResponse: dataResult,
                },
            });
            // Update analysis record as completed
            await database_1.default.analysisRecord.update({
                where: { id: analysisRecordId },
                data: {
                    dataAnalysisId: dataAnalysis.id,
                    status: constants_1.ANALYSIS_STATUS.COMPLETED,
                },
            });
            // Send success notification
            await notification_service_1.default.createNotification({
                userId,
                title: 'Document Processing Complete',
                message: `Your analysis for ${contractUpload.filename} is ready`,
                type: constants_1.NOTIFICATION_TYPES.SUCCESS,
                actionUrl: `/analysis/${analysisRecordId}`,
                relatedRecordType: 'analysis_record',
                relatedRecordId: analysisRecordId,
            });
            logger_1.default.info(`Processing completed for analysis record ${analysisRecordId}`);
        }
        catch (error) {
            logger_1.default.error('Document processing error:', error);
            // Update analysis record as failed
            await database_1.default.analysisRecord.update({
                where: { id: analysisRecordId },
                data: {
                    status: constants_1.ANALYSIS_STATUS.FAILED,
                },
            });
            // Send error notification
            await notification_service_1.default.createNotification({
                userId,
                title: 'Processing Error',
                message: `Failed to process documents. Please try again.`,
                type: constants_1.NOTIFICATION_TYPES.ERROR,
                actionUrl: '/processing',
                relatedRecordType: 'analysis_record',
                relatedRecordId: analysisRecordId,
            });
        }
    }
    /**
     * Get analysis record by ID
     */
    async getAnalysisById(analysisRecordId, userId) {
        const where = { id: analysisRecordId, isDeleted: false };
        if (userId) {
            where.userId = userId;
        }
        const analysis = await database_1.default.analysisRecord.findUnique({
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
    async getUserAnalysisHistory(userId, page = 1, limit = 20, search) {
        const skip = (page - 1) * limit;
        const where = { userId, isDeleted: false };
        if (search) {
            where.OR = [
                { contractUpload: { filename: { contains: search, mode: 'insensitive' } } },
                { dataUpload: { filename: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const [analyses, total] = await Promise.all([
            database_1.default.analysisRecord.findMany({
                where,
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
                skip,
                take: limit,
            }),
            database_1.default.analysisRecord.count({ where }),
        ]);
        return {
            analyses,
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
    async deleteAnalysis(analysisRecordId, deletedBy) {
        await database_1.default.analysisRecord.update({
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
    async getStatistics(userId) {
        const where = { isDeleted: false };
        if (userId) {
            where.userId = userId;
        }
        const [total, completed, processing, failed] = await Promise.all([
            database_1.default.analysisRecord.count({ where }),
            database_1.default.analysisRecord.count({
                where: { ...where, status: constants_1.ANALYSIS_STATUS.COMPLETED },
            }),
            database_1.default.analysisRecord.count({
                where: { ...where, status: constants_1.ANALYSIS_STATUS.PROCESSING },
            }),
            database_1.default.analysisRecord.count({
                where: { ...where, status: constants_1.ANALYSIS_STATUS.FAILED },
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
exports.default = new DocumentService();
//# sourceMappingURL=document.service.js.map