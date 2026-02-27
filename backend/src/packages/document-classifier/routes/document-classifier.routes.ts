import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { DocumentAnalyzerService } from '../services/document-analyzer.service';

const router = express.Router();

const uploadDir = '/tmp/uploads';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Keep original extension so downstream analyzers can detect type
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({ storage });

/**
 * POST /api/document-classifier/analyze
 * Analyze uploaded document
 */
router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { language = 'eng', useAI = 'true', includeMetadata = 'true', promptId: promptIdRaw } = req.body;
    const parsed =
      promptIdRaw != null && promptIdRaw !== ''
        ? parseInt(String(promptIdRaw), 10)
        : undefined;
    const validPromptId =
      typeof parsed === 'number' && Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
    const options: { language: string; useAI: boolean; includeMetadata: boolean; promptId?: number } = {
      language,
      useAI: useAI === 'true' || useAI === true,
      includeMetadata: includeMetadata === 'true' || includeMetadata === true,
    };
    if (validPromptId !== undefined) {
      options.promptId = validPromptId;
    }

    const analyzer = new DocumentAnalyzerService();
    const result = await analyzer.analyzeDocument(req.file.path, options);

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    // eslint-disable-next-line no-console
    console.error('Analysis error:', message);

    return res.status(500).json({
      success: false,
      error: message,
      totalPages: 0,
      pages: [],
      summary: {
        documentTypes: {},
        totalProcessingTime: 0,
        averageConfidence: 0,
      },
    });
  }
});

/**
 * GET /api/document-classifier/health
 * Health check
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'document-classifier',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

export default router;

