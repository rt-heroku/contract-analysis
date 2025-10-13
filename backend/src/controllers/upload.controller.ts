import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../types';
import fileService from '../services/file.service';
import loggingService from '../services/logging.service';
import { ACTION_TYPES, FILE_SIZE_LIMITS } from '../utils/constants';
import { getClientIp, getUserAgent, isValidFileType, formatFileSize } from '../utils/helpers';

class UploadController {
  async uploadFile(req: AuthenticatedRequest, res: Response) {
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
      if (!isValidFileType(req.file.mimetype, uploadType)) {
        return res.status(400).json({
          error: `Invalid file type for ${uploadType}. Expected ${
            uploadType === 'contract' ? 'PDF' : 'Excel/CSV'
          }`,
        });
      }

      // Validate file size
      const maxSize =
        uploadType === 'contract' ? FILE_SIZE_LIMITS.PDF : FILE_SIZE_LIMITS.EXCEL;

      if (req.file.size > maxSize) {
        return res.status(400).json({
          error: `File size exceeds limit of ${formatFileSize(maxSize)}`,
        });
      }

      // Generate or retrieve jobId from session/body
      let jobId = req.body.jobId || req.session?.jobId;
      if (!jobId) {
        jobId = `job_${Date.now()}_${uuidv4()}`;
        if (req.session) {
          req.session.jobId = jobId;
        }
        console.log('🆕 Generated new jobId:', jobId);
      } else {
        console.log('♻️  Reusing existing jobId:', jobId);
      }

      // Convert to base64
      const fileContentBase64 = req.file.buffer.toString('base64');

      // Get simple file type from mimetype
      const fileType = req.file.mimetype.split('/')[1] || req.file.mimetype;
      
      // Save to database
      const upload = await fileService.createUpload(
        req.user.id,
        jobId,
        req.file.originalname,
        fileType.substring(0, 50), // Ensure it fits in VARCHAR(50)
        req.file.size,
        req.file.mimetype,
        fileContentBase64,
        uploadType
      );

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        jobId,
        actionType: ACTION_TYPES.UPLOAD.FILE_UPLOAD,
        actionDescription: `Uploaded ${uploadType} file: ${req.file.originalname}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
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
    } catch (error: any) {
      // Log failed upload
      if (req.user) {
        await loggingService.logActivity({
          userId: req.user.id,
          actionType: ACTION_TYPES.UPLOAD.FILE_UPLOAD_FAILED,
          actionDescription: `Failed to upload file: ${error.message}`,
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req),
          status: 'failed',
        });
      }

      res.status(400).json({ error: error.message });
    }
  }

  async getUserUploads(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const uploadType = req.query.type as string | undefined;

      const uploads = await fileService.getUserUploads(req.user.id, uploadType);

      // Remove base64 content from response
      const uploadsWithoutContent = uploads.map(({ fileContentBase64, ...upload }) => upload);

      res.json({ uploads: uploadsWithoutContent });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteUpload(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const uploadId = parseInt(req.params.id);

      await fileService.deleteUpload(uploadId, req.user.id);

      res.json({ message: 'Upload deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUploadsByJobId(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({ error: 'Job ID is required' });
      }

      const uploads = await fileService.getUploadsByJobId(jobId, req.user.id);

      // Remove base64 content from response
      const uploadsWithoutContent = uploads.map(({ fileContentBase64, ...upload }) => upload);

      res.json({ uploads: uploadsWithoutContent });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new UploadController();

