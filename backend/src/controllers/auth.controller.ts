import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import authService from '../services/auth.service';
import loggingService from '../services/logging.service';
import { ACTION_TYPES } from '../utils/constants';
import { getClientIp, getUserAgent } from '../utils/helpers';

class AuthController {
  async register(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await authService.register(req.body);

      // Log registration
      await loggingService.logActivity({
        userId: user.id,
        actionType: ACTION_TYPES.AUTH.REGISTER,
        actionDescription: `User registered: ${user.email}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.status(201).json({
        message: 'Registration successful',
        user,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: AuthenticatedRequest, res: Response) {
    try {
      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);

      const result = await authService.login(req.body, ipAddress, userAgent);

      // Log login
      await loggingService.logActivity({
        userId: result.user.id,
        actionType: ACTION_TYPES.AUTH.LOGIN,
        actionDescription: `User logged in: ${result.user.email}`,
        ipAddress,
        userAgent,
        metadata: {
          stayLoggedIn: req.body.stayLoggedIn || false,
        },
      });

      res.json({
        message: 'Login successful',
        token: result.token,
        expiresAt: result.expiresAt,
        user: result.user,
      });
    } catch (error: any) {
      // Log failed login
      await loggingService.logActivity({
        actionType: ACTION_TYPES.AUTH.LOGIN_FAILED,
        actionDescription: `Failed login attempt: ${req.body.email}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        status: 'failed',
      });

      res.status(401).json({ error: error.message });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      const token = req.headers.authorization?.substring(7);

      if (token) {
        await authService.logout(token);

        // Log logout
        if (req.user) {
          await loggingService.logActivity({
            userId: req.user.id,
            actionType: ACTION_TYPES.AUTH.LOGOUT,
            actionDescription: `User logged out: ${req.user.email}`,
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
          });
        }
      }

      res.json({ message: 'Logout successful' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async refreshToken(req: AuthenticatedRequest, res: Response) {
    try {
      const oldToken = req.headers.authorization?.substring(7);

      if (!oldToken) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);

      const result = await authService.refreshToken(oldToken, ipAddress, userAgent);

      // Log token refresh
      if (req.user) {
        await loggingService.logActivity({
          userId: req.user.id,
          actionType: ACTION_TYPES.AUTH.REFRESH,
          actionDescription: `Token refreshed for user: ${req.user.email}`,
          ipAddress,
          userAgent,
        });
      }

      res.json({
        message: 'Token refreshed',
        token: result.token,
        expiresAt: result.expiresAt,
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      res.json({ user: req.user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new AuthController();

