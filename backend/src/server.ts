import express, { Express } from 'express';
import cors from 'cors';
import config from './config/env';
import logger from './utils/logger';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import prisma from './config/database';
import { setupStaticFiles } from './config/static';

const app: Express = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api', routes);

// Health check (before static files)
app.get('/health', (req, res) => {
  res.json({
    message: 'Document Processing API',
    version: '1.0.0',
    status: 'running',
    environment: config.nodeEnv,
  });
});

// Serve frontend static files in production
setupStaticFiles(app);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.port;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Clean expired sessions on startup
    const cleanupInterval = setInterval(async () => {
      try {
        await prisma.session.deleteMany({
          where: {
            expiresAt: {
              lt: new Date(),
            },
          },
        });
      } catch (error) {
        logger.error('Session cleanup error:', error);
      }
    }, 60 * 60 * 1000); // Run every hour

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...');
      clearInterval(cleanupInterval);
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down gracefully...');
      clearInterval(cleanupInterval);
      await prisma.$disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

