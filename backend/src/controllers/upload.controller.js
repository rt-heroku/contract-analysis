"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const types_1 = require("../types");
const file_service_1 = __importDefault(require("../services/file.service"));
const logging_service_1 = __importDefault(require("../services/logging.service"));
const constants_1 = require("../utils/constants");
const helpers_1 = require("../utils/helpers");
class UploadController {
    async uploadFile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const { uploadType } = req.body;
            if (!uploadType || !['contract', 'data'].includes(uploadType)) {
                return res.status(400).json({ error: 'Invalid upload type' });
            }
            // Validate file type
            if (!(0, helpers_1.isValidFileType)(req.file.mimetype, uploadType)) {
                return res.status(400).json({
                    error: `Invalid file type for ${uploadType}. Expected ${uploadType === 'contract' ? 'PDF' : 'Excel/CSV'}`,
                });
            }
            // Validate file size
            const maxSize = uploadType === 'contract' ? constants_1.FILE_SIZE_LIMITS.PDF : constants_1.FILE_SIZE_LIMITS.EXCEL;
            if (req.file.size > maxSize) {
                return res.status(400).json({
                    error: `File size exceeds limit of ${(0, helpers_1.formatFileSize)(maxSize)}`,
                });
            }
            // Generate or retrieve jobId from session/body
            let jobId = req.body.jobId || req.session?.jobId;
            if (!jobId) {
                jobId = `job_${Date.now()}_${(0, uuid_1.v4)()}`;
                if (req.session) {
                    req.session.jobId = jobId;
                }
                console.log('🆕 Generated new jobId:', jobId);
            }
            else {
                console.log('♻️  Reusing existing jobId:', jobId);
            }
            // Convert to base64
            const fileContentBase64 = req.file.buffer.toString('base64');
            // Get simple file type from mimetype
            const fileType = req.file.mimetype.split('/')[1] || req.file.mimetype;
            // Save to database
            const upload = await file_service_1.default.createUpload(req.user.id, jobId, req.file.originalname, fileType.substring(0, 50), // Ensure it fits in VARCHAR(50)
            req.file.size, req.file.mimetype, fileContentBase64, uploadType);
            // Log activity
            await logging_service_1.default.logActivity({
                userId: req.user.id,
                jobId,
                actionType: constants_1.ACTION_TYPES.UPLOAD.FILE_UPLOAD,
                actionDescription: `Uploaded ${uploadType} file: ${req.file.originalname}`,
                ipAddress: (0, helpers_1.getClientIp)(req),
                userAgent: (0, helpers_1.getUserAgent)(req),
                metadata: {
                    uploadId: upload.id,
                    filename: req.file.originalname,
                    fileSize: req.file.size,
                    uploadType,
                    jobId,
                },
            });
            res.status(201).json({
                message: 'File uploaded successfully',
                upload: {
                    id: upload.id,
                    jobId: upload.jobId,
                    filename: upload.filename,
                    fileType: upload.fileType,
                    fileSize: upload.fileSize,
                    uploadType: upload.uploadType,
                    createdAt: upload.createdAt,
                },
            });
        }
        catch (error) {
            // Log failed upload
            if (req.user) {
                await logging_service_1.default.logActivity({
                    userId: req.user.id,
                    actionType: constants_1.ACTION_TYPES.UPLOAD.FILE_UPLOAD_FAILED,
                    actionDescription: `Failed to upload file: ${error.message}`,
                    ipAddress: (0, helpers_1.getClientIp)(req),
                    userAgent: (0, helpers_1.getUserAgent)(req),
                    status: 'failed',
                });
            }
            res.status(400).json({ error: error.message });
        }
    }
    async getUserUploads(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const uploadType = req.query.type;
            const uploads = await file_service_1.default.getUserUploads(req.user.id, uploadType);
            // Remove base64 content from response
            const uploadsWithoutContent = uploads.map(({ fileContentBase64, ...upload }) => upload);
            res.json({ uploads: uploadsWithoutContent });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async deleteUpload(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const uploadId = parseInt(req.params.id);
            await file_service_1.default.deleteUpload(uploadId, req.user.id);
            res.json({ message: 'Upload deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.default = new UploadController();
//# sourceMappingURL=upload.controller.js.map