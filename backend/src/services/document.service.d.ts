import { ProcessingResult } from '../types';
declare class DocumentService {
    /**
     * Start document processing workflow
     */
    startProcessing(userId: number, contractUploadId: number, dataUploadId: number): Promise<ProcessingResult>;
    /**
     * Process documents (async)
     */
    private processDocuments;
    /**
     * Get analysis record by ID
     */
    getAnalysisById(analysisRecordId: number, userId?: number): Promise<({
        user: {
            id: number;
            email: string;
            firstName: string | null;
            lastName: string | null;
        };
        contractAnalysis: {
            jobId: string;
            status: string;
            terms: import("@prisma/client/runtime/library").JsonValue | null;
            products: import("@prisma/client/runtime/library").JsonValue | null;
            id: number;
            createdAt: Date;
            documentName: string;
            mulesoftResponse: import("@prisma/client/runtime/library").JsonValue | null;
            processedAt: Date;
            uploadId: number;
        } | null;
        dataAnalysis: {
            jobId: string;
            id: number;
            createdAt: Date;
            contractAnalysisId: number;
            mulesoftResponse: import("@prisma/client/runtime/library").JsonValue | null;
            processedAt: Date;
            analysisMarkdown: string;
            dataTable: import("@prisma/client/runtime/library").JsonValue;
        } | null;
        contractUpload: {
            filename: string;
            jobId: string;
            id: number;
            createdAt: Date;
            userId: number;
            uploadType: string;
            fileType: string;
            fileSize: number;
            mimeType: string | null;
            fileContentBase64: string;
        } | null;
        dataUpload: {
            filename: string;
            jobId: string;
            id: number;
            createdAt: Date;
            userId: number;
            uploadType: string;
            fileType: string;
            fileSize: number;
            mimeType: string | null;
            fileContentBase64: string;
        } | null;
    } & {
        jobId: string;
        status: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        isDeleted: boolean;
        deletedAt: Date | null;
        contractUploadId: number | null;
        dataUploadId: number | null;
        contractAnalysisId: number | null;
        dataAnalysisId: number | null;
        deletedBy: number | null;
    }) | null>;
    /**
     * Get user analysis history
     */
    getUserAnalysisHistory(userId: number, page?: number, limit?: number, search?: string): Promise<{
        analyses: ({
            contractAnalysis: {
                terms: import("@prisma/client/runtime/library").JsonValue;
            } | null;
            contractUpload: {
                filename: string;
                createdAt: Date;
            } | null;
            dataUpload: {
                filename: string;
            } | null;
        } & {
            jobId: string;
            status: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number;
            isDeleted: boolean;
            deletedAt: Date | null;
            contractUploadId: number | null;
            dataUploadId: number | null;
            contractAnalysisId: number | null;
            dataAnalysisId: number | null;
            deletedBy: number | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Delete analysis (admin - soft delete)
     */
    deleteAnalysis(analysisRecordId: number, deletedBy: number): Promise<void>;
    /**
     * Get analysis statistics
     */
    getStatistics(userId?: number): Promise<{
        total: number;
        completed: number;
        processing: number;
        failed: number;
    }>;
}
declare const _default: DocumentService;
export default _default;
//# sourceMappingURL=document.service.d.ts.map