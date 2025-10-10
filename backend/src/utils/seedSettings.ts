import prisma from '../config/database';
import logger from './logger';

export const seedDefaultSettings = async () => {
  const defaultSettings = [
    {
      settingKey: 'app_name',
      settingValue: 'DocProcess',
      description: 'Application name displayed in sidebar and header',
      isSecret: false,
    },
    {
      settingKey: 'app_logo_url',
      settingValue: '/images/logos/MuleSoft-RGB-icon.png',
      description: 'Application logo URL (can be uploaded by admin)',
      isSecret: false,
    },
    {
      settingKey: 'mulesoft_api_base_url',
      settingValue: process.env.MULESOFT_API_BASE_URL || 'http://localhost:8081',
      description: 'MuleSoft API base URL',
      isSecret: false,
    },
    {
      settingKey: 'mulesoft_api_username',
      settingValue: process.env.MULESOFT_API_USERNAME || '',
      description: 'MuleSoft API username for basic authentication',
      isSecret: true,
    },
    {
      settingKey: 'mulesoft_api_password',
      settingValue: process.env.MULESOFT_API_PASSWORD || '',
      description: 'MuleSoft API password for basic authentication',
      isSecret: true,
    },
    {
      settingKey: 'mulesoft_api_timeout',
      settingValue: process.env.MULESOFT_API_TIMEOUT || '180000',
      description: 'MuleSoft API timeout in milliseconds',
      isSecret: false,
    },
    {
      settingKey: 'cors_origin',
      settingValue: process.env.CORS_ORIGIN || 'http://localhost:3000',
      description: 'CORS allowed origin',
      isSecret: false,
    },
    {
      settingKey: 'jwt_secret',
      settingValue: process.env.JWT_SECRET || 'change-this-secret-key-in-production',
      description: 'JWT secret key for token signing',
      isSecret: true,
    },
    {
      settingKey: 'jwt_expires_in',
      settingValue: process.env.JWT_EXPIRES_IN || '7d',
      description: 'JWT token expiration time',
      isSecret: false,
    },
    {
      settingKey: 'log_level',
      settingValue: process.env.LOG_LEVEL || 'info',
      description: 'Logging level (debug, info, warn, error)',
      isSecret: false,
    },
  ];

  logger.info('Seeding default system settings...');

  for (const setting of defaultSettings) {
    try {
      await prisma.systemSetting.upsert({
        where: { settingKey: setting.settingKey },
        update: {
          description: setting.description,
          isSecret: setting.isSecret,
          // Only update value if it's empty
        },
        create: setting,
      });
      logger.info(`✓ Seeded setting: ${setting.settingKey}`);
    } catch (error: any) {
      logger.error(`✗ Failed to seed setting: ${setting.settingKey}`, error.message);
    }
  }

  logger.info('✅ System settings seeded successfully');
};

