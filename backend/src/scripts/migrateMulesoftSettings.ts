import prisma from '../config/database';
import axios from 'axios';
import logger from '../utils/logger';
import { encryption } from '../utils/encryption';

/**
 * Migration script to move MuleSoft configuration from system_settings to mulesoft_apis table
 * Run with: npx ts-node src/scripts/migrateMulesoftSettings.ts
 */
async function migrateMulesoftSettings() {
  try {
    logger.info('Starting MuleSoft settings migration...');

    // Check if migration already done
    const existingApis = await prisma.mulesoftApi.count();
    if (existingApis > 0) {
      logger.info('Migration already completed. MuleSoft APIs already exist.');
      return;
    }

    // Get system settings
    const baseUrlSetting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'mulesoft_api_base_url' },
    });
    const usernameSetting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'mulesoft_api_username' },
    });
    const passwordSetting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'mulesoft_api_password' },
    });
    const timeoutSetting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'mulesoft_api_timeout' },
    });

    if (!baseUrlSetting || !baseUrlSetting.settingValue) {
      logger.warn('No MuleSoft API base URL found in system_settings. Skipping migration.');
      return;
    }

    const baseUrl = baseUrlSetting.settingValue;
    const username = usernameSetting?.settingValue || '';
    const password = passwordSetting?.settingValue || '';
    const timeout = timeoutSetting?.settingValue ? parseInt(timeoutSetting.settingValue) : 180000;

    // Find admin user (first user with admin role)
    const adminUser = await prisma.user.findFirst({
      where: {
        userRoles: {
          some: {
            role: {
              name: {
                in: ['Admin', 'admin'],
              },
            },
          },
        },
      },
    });

    if (!adminUser) {
      logger.error('No admin user found. Cannot assign API ownership.');
      return;
    }

    logger.info(`Creating MuleSoft API: ${baseUrl}`);

    // Determine auth type and config
    let authType = 'none';
    let authConfig: any = null;

    if (username && password) {
      authType = 'basic';
      authConfig = {
        username: encryption.encrypt(username),
        password: encryption.encrypt(password),
      };
      logger.info('Using Basic Auth');
    }

    // Create API entry
    const api = await prisma.mulesoftApi.create({
      data: {
        name: 'Default MuleSoft API',
        description: 'Migrated from system_settings',
        baseUrl,
        authType,
        authConfig,
        timeout,
        isActive: true,
        flowsStatus: 'pending',
        createdBy: adminUser.id,
        sharedWith: [],
      },
    });

    logger.info(`Created MuleSoft API with ID: ${api.id}`);

    // Try to fetch flows from /flows endpoint
    try {
      logger.info('Fetching flows from API...');
      
      const headers: any = {};
      if (authType === 'basic' && username && password) {
        const auth = Buffer.from(`${username}:${password}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      }

      const response = await axios.get(`${baseUrl}/flows`, {
        headers,
        timeout,
      });

      if (response.data && response.data.flows && Array.isArray(response.data.flows)) {
        const flows = response.data.flows;
        logger.info(`Found ${flows.length} flows`);

        // Insert flows
        for (const flow of flows) {
          await prisma.mulesoftFlow.create({
            data: {
              mulesoftApiId: api.id,
              name: flow.name,
              description: flow.description || null,
              url: flow.url,
              method: flow.method || 'POST',
              vars: flow.vars || null,
              isActive: true,
            },
          });
          logger.info(`  - Created flow: ${flow.name}`);
        }

        // Update API status
        await prisma.mulesoftApi.update({
          where: { id: api.id },
          data: {
            flowsStatus: 'success',
            lastFlowsSync: new Date(),
          },
        });

        logger.info('✅ Migration completed successfully!');
      } else {
        throw new Error('Invalid response format from /flows endpoint');
      }
    } catch (flowError: any) {
      logger.error(`Failed to fetch flows: ${flowError.message}`);
      
      // Update API with error status
      await prisma.mulesoftApi.update({
        where: { id: api.id },
        data: {
          flowsStatus: 'error',
          flowsError: flowError.message,
          lastFlowsSync: new Date(),
        },
      });

      logger.warn('⚠️ API created but flows could not be fetched. Manual flow entry required.');
    }
  } catch (error: any) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateMulesoftSettings()
  .then(() => {
    logger.info('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration script failed:', error);
    process.exit(1);
  });

