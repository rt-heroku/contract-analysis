import express, { Express } from 'express';
import path from 'path';

/**
 * Serve frontend static files in production
 * This allows running both frontend and backend in a single app
 */
export const setupStaticFiles = (app: Express) => {
  if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../../frontend/dist');
    
    // Serve static files
    app.use(express.static(frontendPath));
    
    // Handle SPA routing - serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api')) {
        return next();
      }
      
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  }
};

