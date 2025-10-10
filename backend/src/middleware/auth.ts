import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import authService from '../services/auth.service';
import prisma from '../config/database';
import logger from '../utils/logger';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = authService.verifyToken(token);

    // Check if session exists and is valid
    const session = await prisma.session.findFirst({
      where: {
        token,
        userId: payload.id,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Check if user is active
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User account is disabled' });
    }

    // Attach user to request
    req.user = payload;

    next();
  } catch (error: any) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const authenticate = authenticateToken;

export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);

      const session = await prisma.session.findFirst({
        where: {
          token,
          userId: payload.id,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (session) {
        req.user = payload;
      }
    }

    next();
  } catch (error) {
    // If authentication fails, continue without user
    next();
  }
};

