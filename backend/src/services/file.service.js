"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
class FileService {
    /**
     * Create upload record
     */
    async createUpload(userId, jobId, filename, fileType, fileSize, mimeType, fileContentBase64, uploadType) {
        return database_1.default.upload.create({
            data: {
                userId,
                jobId,
                filename,
                fileType,
                fileSize,
                mimeType,
                fileContentBase64,
                uploadType,
            },
        });
    }
    /**
     * Get upload by ID
     */
    async getUploadById(uploadId, userId) {
        const where = { id: uploadId };
        if (userId) {
            where.userId = userId;
        }
        return database_1.default.upload.findUnique({
            where,
        });
    }
    /**
     * Get user uploads
     */
    async getUserUploads(userId, uploadType) {
        const where = { userId };
        if (uploadType) {
            where.uploadType = uploadType;
        }
        return database_1.default.upload.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Delete upload
     */
    async deleteUpload(uploadId, userId) {
        const where = { id: uploadId };
        if (userId) {
            where.userId = userId;
        }
        await database_1.default.upload.delete({
            where,
        });
    }
}
exports.default = new FileService();
//# sourceMappingURL=file.service.js.map