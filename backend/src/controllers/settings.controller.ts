import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/logos');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error: any) {
      cb(error, uploadDir);
    }
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpg, png, svg) are allowed!'));
  }
});

class SettingsController {
  /**
   * Get all public settings (non-secret)
   */
  async getPublicSettings(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { isSecret: false },
        select: {
          settingKey: true,
          settingValue: true,
          description: true,
        },
      });

      const settingsObj = settings.reduce((acc: any, setting) => {
        acc[setting.settingKey] = setting.settingValue;
        return acc;
      }, {});

      res.json({ settings: settingsObj });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get all settings (admin only, includes secrets)
   */
  async getAllSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if user is admin
      const userRoles = await prisma.userRole.findMany({
        where: { userId: req.user.id },
        include: { role: true },
      });

      const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');
      if (!isAdmin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      const settings = await prisma.systemSetting.findMany({
        orderBy: { settingKey: 'asc' },
      });

      res.json({ settings });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update a setting (admin only)
   */
  async updateSetting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if user is admin
      const userRoles = await prisma.userRole.findMany({
        where: { userId: req.user.id },
        include: { role: true },
      });

      const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');
      if (!isAdmin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      const { settingKey } = req.params;
      const { settingValue } = req.body;

      const updated = await prisma.systemSetting.update({
        where: { settingKey },
        data: { settingValue },
      });

      res.json({ setting: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Upload logo (admin only)
   */
  async uploadLogo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if user is admin
      const userRoles = await prisma.userRole.findMany({
        where: { userId: req.user.id },
        include: { role: true },
      });

      const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');
      if (!isAdmin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const logoUrl = `/uploads/logos/${req.file.filename}`;

      // Update the logo URL in settings
      await prisma.systemSetting.update({
        where: { settingKey: 'app_logo_url' },
        data: { settingValue: logoUrl },
      });

      res.json({ logoUrl });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new SettingsController();

