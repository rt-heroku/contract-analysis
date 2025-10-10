declare class FileService {
    /**
     * Create upload record
     */
    createUpload(userId: number, jobId: string, filename: string, fileType: string, fileSize: number, mimeType: string, fileContentBase64: string, uploadType: 'contract' | 'data'): Promise<{
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
    }>;
    /**
     * Get upload by ID
     */
    getUploadById(uploadId: number, userId?: number): Promise<{
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
    } | null>;
    /**
     * Get user uploads
     */
    getUserUploads(userId: number, uploadType?: string): Promise<{
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
    }[]>;
    /**
     * Delete upload
     */
    deleteUpload(uploadId: number, userId?: number): Promise<void>;
}
declare const _default: FileService;
export default _default;
//# sourceMappingURL=file.service.d.ts.map