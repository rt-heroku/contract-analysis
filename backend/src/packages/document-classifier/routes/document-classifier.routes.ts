import express from 'express';
import multer from 'multer';
import { DocumentAnalyzerService } from '../services/document-analyzer.service';

const router = express.Router();
const upload = multer({ dest: '/tmp/uploads/' });

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

    const { language = 'eng', useAI = 'true', includeMetadata = 'true' } = req.body;

    const analyzer = new DocumentAnalyzerService();
    const result = await analyzer.analyzeDocument(req.file.path, {
      language,
      useAI: useAI === 'true' || useAI === true,
      includeMetadata: includeMetadata === 'true' || includeMetadata === true,
    });

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

