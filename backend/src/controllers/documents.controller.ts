import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';
import loggingService from '../services/logging.service';
import { ACTION_TYPES } from '../utils/constants';
import { getClientIp, getUserAgent } from '../utils/helpers';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

class DocumentsController {
  /**
   * Get all documents (with IDP processing status)
   */
  async getDocuments(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const isAdmin = req.user.roles.includes('admin');

      // Get all uploads with their contract analysis status
      const documents = await prisma.upload.findMany({
        where: isAdmin ? {} : { userId: req.user.id },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          contractAnalysis: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform to include hasBeenProcessed flag
      const documentsWithStatus = documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        originalFilename: doc.filename,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        jobId: doc.jobId,
        userId: doc.userId,
        createdAt: doc.createdAt,
        hasBeenProcessed: doc.contractAnalysis.length > 0,
        user: doc.user,
      }));

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.NAVIGATION.PAGE_VIEW,
        actionDescription: 'Viewed documents library',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ documents: documentsWithStatus });
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }

  /**
   * Upload a new document
   */
  async uploadDocument(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { type } = req.body; // 'contract' or 'data'

      if (!type || !['contract', 'data'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type. Must be "contract" or "data"' });
      }

      // Generate unique filename and jobId
      const originalFilename = req.file.originalname;
      const fileExtension = originalFilename.split('.').pop();
      const uniqueFilename = `${uuidv4()}.${fileExtension}`;
      const jobId = uuidv4();

      // Convert file to base64
      const fileContentBase64 = req.file.buffer.toString('base64');

      // Create upload record
      const upload = await prisma.upload.create({
        data: {
          filename: uniqueFilename,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          fileContentBase64,
          jobId,
          uploadType: type,
          userId: req.user.id,
        },
      });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.UPLOAD.FILE_UPLOAD,
        actionDescription: `Uploaded ${type} file: ${originalFilename}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: {
          filename: originalFilename,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          jobId,
        },
      });

      res.status(201).json({
        message: 'File uploaded successfully',
        document: {
          id: upload.id,
          filename: upload.filename,
          originalFilename: originalFilename,
          fileType: upload.fileType,
          fileSize: upload.fileSize,
          jobId: upload.jobId,
        },
      });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }

  /**
   * Download a document
   */
  async downloadDocument(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const documentId = parseInt(req.params.id);
      const isAdmin = req.user.roles.includes('admin');

      const document = await prisma.upload.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check permissions
      if (!isAdmin && document.userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to download this document' });
      }

      // Convert base64 back to buffer
      const fileBuffer = Buffer.from(document.fileContentBase64, 'base64');

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'file.download',
        actionDescription: `Downloaded file: ${document.filename}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: {
          documentId,
          filename: document.filename,
        },
      });

      // Set headers for file download
      res.setHeader('Content-Type', document.fileType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
      res.send(fileBuffer);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      res.status(500).json({ error: 'Failed to download document' });
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const documentId = parseInt(req.params.id);
      const isAdmin = req.user.roles.includes('admin');

      const document = await prisma.upload.findUnique({
        where: { id: documentId },
        include: {
          contractAnalysis: true,
          contractRecords: true,
          dataRecords: true,
        },
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check permissions
      if (!isAdmin && document.userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this document' });
      }

      // Check if document is used in any analysis
      if (document.contractAnalysis.length > 0 || document.contractRecords.length > 0 || document.dataRecords.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete document that has been used in analysis. Please delete the analysis records first.' 
        });
      }

      // Delete the document
      await prisma.upload.delete({
        where: { id: documentId },
      });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'file.delete',
        actionDescription: `Deleted file: ${document.filename}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: {
          documentId,
          filename: document.filename,
        },
      });

      res.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }

  /**
   * Get upload middleware
   */
  getUploadMiddleware() {
    return upload.single('file');
  }
}

export default new DocumentsController();

