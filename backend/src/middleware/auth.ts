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
    console.log('🔐 [Auth Middleware] Checking authentication for:', req.method, req.path);
    console.log('🔐 [Auth Middleware] Auth header present:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔐 [Auth Middleware] No valid auth header - returning 401');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    console.log('🔐 [Auth Middleware] Token extracted, length:', token.length);

    // Verify token
    console.log('🔐 [Auth Middleware] Verifying token...');
    const payload = authService.verifyToken(token);
    console.log('🔐 [Auth Middleware] Token verified, user ID:', payload.id);

    // Check if session exists and is valid
    console.log('🔐 [Auth Middleware] Checking session...');
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
      console.log('🔐 [Auth Middleware] Session not found or expired - returning 401');
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    console.log('🔐 [Auth Middleware] Session valid, checking user...');
    // Check if user is active
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user || !user.isActive) {
      console.log('🔐 [Auth Middleware] User not found or inactive - returning 401');
      return res.status(401).json({ error: 'User account is disabled' });
    }

    console.log('🔐 [Auth Middleware] User authenticated:', user.email);
    // Attach user to request
    req.user = payload;

    next();
  } catch (error: any) {
    console.error('🔐 [Auth Middleware] Authentication error:', error);
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
    console.log('🔐 [Optional Auth] Checking optional authentication for:', req.method, req.path);

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
        console.log('🔐 [Optional Auth] User authenticated:', payload.id);
        req.user = payload;
      } else {
        console.log('🔐 [Optional Auth] Session invalid, continuing without auth');
      }
    } else {
      console.log('🔐 [Optional Auth] No auth header, continuing without auth');
    }

    next();
  } catch (error) {
    console.log('🔐 [Optional Auth] Error during optional auth, continuing without auth:', error);
    // If authentication fails, continue without user
    next();
  }
};
