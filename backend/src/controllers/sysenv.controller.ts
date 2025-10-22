import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sysenvController = {
  async getSystemInfo(req: Request, res: Response) {
    try {
      // Get all environment variables
      const envVars = process.env;

      // Get all system settings from database
      const systemSettings = await prisma.systemSetting.findMany({
        orderBy: { settingKey: 'asc' },
      });

      // Get Node.js version and other system info
      const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cwd: process.cwd(),
        env: process.env.NODE_ENV,
      };

      // Get database connection status
      let dbStatus = 'Unknown';
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'Connected ✅';
      } catch (error) {
        dbStatus = `Error: ${error}`;
      }

      // Count users
      const userCount = await prisma.user.count();
      const roleCount = await prisma.role.count();
      const sessionCount = await prisma.session.count();

      res.json({
        systemInfo,
        database: {
          status: dbStatus,
          url: process.env.DATABASE_URL || 'Not Set ❌',
          userCount,
          roleCount,
          sessionCount,
        },
        environmentVariables: Object.keys(envVars)
          .sort()
          .reduce((acc, key) => {
            // Show all values unmasked for debugging
            acc[key] = envVars[key];
            return acc;
          }, {} as Record<string, string | undefined>),
        systemSettings: systemSettings.map((setting: any) => ({
          key: setting.settingKey,
          value: setting.settingValue, // Show all values unmasked
          description: setting.description,
          isSecret: setting.isSecret,
        })),
        jwt: {
          secret: process.env.JWT_SECRET || 'Not Set ❌',
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        },
        cors: {
          origin: process.env.CORS_ORIGIN || '*',
        },
        port: process.env.PORT || 5001,
      });
    } catch (error: any) {
      console.error('Error getting system info:', error);
      res.status(500).json({
        error: 'Failed to get system info',
        message: error.message,
        stack: error.stack,
      });
    }
  },
};
