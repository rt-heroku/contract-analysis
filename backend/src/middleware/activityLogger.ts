import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import loggingService from '../services/logging.service';
import { getClientIp, getUserAgent } from '../utils/helpers';

export const logActivity = (actionType: string, getDescription: (req: AuthenticatedRequest) => string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function to log after response
    res.send = function (body: any): Response {
      // Only log if response was successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        loggingService
          .logActivity({
            userId: req.user?.id,
            actionType,
            actionDescription: getDescription(req),
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            metadata: {
              method: req.method,
              path: req.path,
              params: req.params,
              query: req.query,
            },
            status: 'success',
          })
          .catch((error) => {
            console.error('Failed to log activity:', error);
          });
      }

      // Call original send
      return originalSend.call(this, body);
    };

    next();
  };
};

