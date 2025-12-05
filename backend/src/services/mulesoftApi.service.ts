import prisma from '../config/database';
import axios from 'axios';
import { encryption } from '../utils/encryption';
import logger from '../utils/logger';
import flowOpenAPIImporter, { FlowPreview } from './flow-openapi-importer.service';

export const mulesoftApiService = {
  /**
   * Create new MuleSoft API
   */
  async create(userId: number, data: {
    name: string;
    description?: string;
    baseUrl: string;
    authType: string;
    authConfig?: any;
    timeout?: number;
  }) {
    // Encrypt auth credentials
    let encryptedAuthConfig = null;
    if (data.authConfig) {
      encryptedAuthConfig = { ...data.authConfig };
      
      if (data.authType === 'basic' && data.authConfig.username && data.authConfig.password) {
        encryptedAuthConfig.username = encryption.encrypt(data.authConfig.username);
        encryptedAuthConfig.password = encryption.encrypt(data.authConfig.password);
      } else if (data.authType === 'bearer' && data.authConfig.token) {
        encryptedAuthConfig.token = encryption.encrypt(data.authConfig.token);
      } else if (data.authType === 'api_key' && data.authConfig.apiKey) {
        encryptedAuthConfig.apiKey = encryption.encrypt(data.authConfig.apiKey);
      } else if (data.authType === 'oauth2' && data.authConfig.clientSecret) {
        encryptedAuthConfig.clientSecret = encryption.encrypt(data.authConfig.clientSecret);
      }
    }

    return await prisma.mulesoftApi.create({
      data: {
        name: data.name,
        description: data.description,
        baseUrl: data.baseUrl,
        authType: data.authType,
        authConfig: encryptedAuthConfig,
        timeout: data.timeout || 180000,
        isActive: true,
        flowsStatus: 'pending',
        createdBy: userId,
        sharedWith: [],
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        flows: true,
      },
    });
  },

  /**
   * Get user's MuleSoft APIs
   */
  async getUserApis(userId: number) {
    const apis = await prisma.mulesoftApi.findMany({
      where: {
        createdBy: userId,
        isActive: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        flows: {
          where: { isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.maskSecrets(apis, userId);
  },

  /**
   * Get APIs shared with user
   */
  async getSharedApis(userId: number) {
    const allApis = await prisma.mulesoftApi.findMany({
      where: {
        isActive: true,
        createdBy: { not: userId },
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        flows: {
          where: { isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by sharedWith
    const sharedApis = allApis.filter((api) => {
      const sharedWith = Array.isArray(api.sharedWith)
        ? api.sharedWith
        : Object.values(api.sharedWith || {}).filter((v: any) => typeof v === 'number');
      return sharedWith.includes(userId);
    });

    return this.maskSecrets(sharedApis, userId);
  },

  /**
   * Get all other APIs (admin only)
   */
  async getAllOtherApis(userId: number) {
    const allApis = await prisma.mulesoftApi.findMany({
      where: {
        isActive: true,
        createdBy: { not: userId },
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        flows: {
          where: { isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter out APIs shared with the user (already in shared section)
    const otherApis = allApis.filter((api) => {
      const sharedWith = Array.isArray(api.sharedWith)
        ? api.sharedWith
        : Object.values(api.sharedWith || {}).filter((v: any) => typeof v === 'number');
      return !sharedWith.includes(userId);
    });

    return this.maskSecrets(otherApis, userId);
  },

  /**
   * Get single API by ID
   */
  async getById(id: number, userId: number, isAdmin: boolean = false) {
    const api = await prisma.mulesoftApi.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        flows: {
          where: { isActive: true },
        },
      },
    });

    if (!api) {
      throw new Error('MuleSoft API not found');
    }

    // Check access
    const sharedWith = Array.isArray(api.sharedWith)
      ? api.sharedWith
      : Object.values(api.sharedWith || {}).filter((v: any) => typeof v === 'number');
    
    const hasAccess = api.createdBy === userId || sharedWith.includes(userId) || isAdmin;
    
    if (!hasAccess) {
      throw new Error('Not authorized');
    }

    // Decrypt credentials if owner
    if (api.createdBy === userId) {
      return this.decryptApi(api);
    } else {
      // Mask secrets for shared users
      return this.maskSecrets([api], userId)[0];
    }
  },

  /**
   * Update MuleSoft API
   */
  async update(id: number, userId: number, data: any, isAdmin: boolean = false) {
    const api = await prisma.mulesoftApi.findUnique({
      where: { id },
    });

    if (!api) {
      throw new Error('MuleSoft API not found');
    }

    // Allow update if owner OR admin
    if (api.createdBy !== userId && !isAdmin) {
      throw new Error('Not authorized');
    }

    // Encrypt auth config if provided
    let encryptedAuthConfig = data.authConfig;
    if (data.authConfig) {
      encryptedAuthConfig = { ...data.authConfig };
      
      if (data.authType === 'basic' && data.authConfig.username && data.authConfig.password) {
        encryptedAuthConfig.username = encryption.encrypt(data.authConfig.username);
        encryptedAuthConfig.password = encryption.encrypt(data.authConfig.password);
      } else if (data.authType === 'bearer' && data.authConfig.token) {
        encryptedAuthConfig.token = encryption.encrypt(data.authConfig.token);
      } else if (data.authType === 'api_key' && data.authConfig.apiKey) {
        encryptedAuthConfig.apiKey = encryption.encrypt(data.authConfig.apiKey);
      } else if (data.authType === 'oauth2' && data.authConfig.clientSecret) {
        encryptedAuthConfig.clientSecret = encryption.encrypt(data.authConfig.clientSecret);
      }
    }

    const updated = await prisma.mulesoftApi.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        baseUrl: data.baseUrl,
        authType: data.authType,
        authConfig: encryptedAuthConfig,
        timeout: data.timeout,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        flows: true,
      },
    });

    return this.decryptApi(updated);
  },

  /**
   * Delete MuleSoft API (soft delete)
   */
  async delete(id: number, userId: number, isAdmin: boolean = false) {
    const api = await prisma.mulesoftApi.findUnique({
      where: { id },
    });

    if (!api) {
      throw new Error('MuleSoft API not found');
    }

    // Allow delete if owner OR admin
    if (api.createdBy !== userId && !isAdmin) {
      throw new Error('Not authorized');
    }

    return await prisma.mulesoftApi.update({
      where: { id },
      data: { isActive: false },
    });
  },

  /**
   * Refresh flows from API /flows endpoint
   */
  async refreshFlows(id: number, userId: number, isAdmin: boolean = false) {
    const api = await prisma.mulesoftApi.findUnique({
      where: { id },
    });

    if (!api) {
      throw new Error('MuleSoft API not found');
    }

    // Check access
    const sharedWith = Array.isArray(api.sharedWith)
      ? api.sharedWith
      : Object.values(api.sharedWith || {}).filter((v: any) => typeof v === 'number');
    
    const hasAccess = api.createdBy === userId || sharedWith.includes(userId) || isAdmin;
    
    if (!hasAccess) {
      throw new Error('Not authorized');
    }

    try {
      logger.info(`Refreshing flows for MuleSoft API ${id}...`);

      // Build request headers
      const headers: any = {};
      
      if (api.authType === 'basic' && api.authConfig) {
        const config = api.authConfig as any;
        const username = encryption.decrypt(config.username);
        const password = encryption.decrypt(config.password);
        const auth = Buffer.from(`${username}:${password}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      } else if (api.authType === 'bearer' && api.authConfig) {
        const config = api.authConfig as any;
        const token = encryption.decrypt(config.token);
        headers['Authorization'] = `Bearer ${token}`;
      } else if (api.authType === 'api_key' && api.authConfig) {
        const config = api.authConfig as any;
        const apiKey = encryption.decrypt(config.apiKey);
        headers[config.headerName || 'X-API-Key'] = apiKey;
      }

      // Call /flows endpoint
      const response = await axios.get(`${api.baseUrl}/flows`, {
        headers,
        timeout: api.timeout,
      });

      if (!response.data || !response.data.flows || !Array.isArray(response.data.flows)) {
        throw new Error('Invalid response format from /flows endpoint');
      }

      const flows = response.data.flows;
      logger.info(`Found ${flows.length} flows`);

      // Deactivate existing flows
      await prisma.mulesoftFlow.updateMany({
        where: { mulesoftApiId: id },
        data: { isActive: false },
      });

      // Insert/update flows
      for (const flow of flows) {
        await prisma.mulesoftFlow.upsert({
          where: {
            mulesoftApiId_name: {
              mulesoftApiId: id,
              name: flow.name,
            },
          },
          create: {
            mulesoftApiId: id,
            name: flow.name,
            description: flow.description || null,
            url: flow.url,
            method: flow.method || 'POST',
            vars: flow.vars || null,
            isActive: true,
          },
          update: {
            description: flow.description || null,
            url: flow.url,
            method: flow.method || 'POST',
            vars: flow.vars || null,
            isActive: true,
          },
        });
      }

      // Update API status
      await prisma.mulesoftApi.update({
        where: { id },
        data: {
          flowsStatus: 'success',
          flowsError: null,
          lastFlowsSync: new Date(),
        },
      });

      logger.info(`Successfully refreshed ${flows.length} flows`);
      return { success: true, flowCount: flows.length };
    } catch (error: any) {
      logger.error(`Failed to refresh flows: ${error.message}`);
      
      // Update API with error status
      await prisma.mulesoftApi.update({
        where: { id },
        data: {
          flowsStatus: 'error',
          flowsError: error.message,
          lastFlowsSync: new Date(),
        },
      });

      throw error;
    }
  },

  /**
   * Test API connection
   */
  async testConnection(id: number, userId: number, isAdmin: boolean = false) {
    const api = await prisma.mulesoftApi.findUnique({
      where: { id },
    });

    if (!api) {
      throw new Error('MuleSoft API not found');
    }

    // Check access
    const sharedWith = Array.isArray(api.sharedWith)
      ? api.sharedWith
      : Object.values(api.sharedWith || {}).filter((v: any) => typeof v === 'number');
    
    const hasAccess = api.createdBy === userId || sharedWith.includes(userId) || isAdmin;
    
    if (!hasAccess) {
      throw new Error('Not authorized');
    }

    try {
      // Build request headers
      const headers: any = {};
      
      if (api.authType === 'basic' && api.authConfig) {
        const config = api.authConfig as any;
        const username = encryption.decrypt(config.username);
        const password = encryption.decrypt(config.password);
        const auth = Buffer.from(`${username}:${password}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      } else if (api.authType === 'bearer' && api.authConfig) {
        const config = api.authConfig as any;
        const token = encryption.decrypt(config.token);
        headers['Authorization'] = `Bearer ${token}`;
      } else if (api.authType === 'api_key' && api.authConfig) {
        const config = api.authConfig as any;
        const apiKey = encryption.decrypt(config.apiKey);
        headers[config.headerName || 'X-API-Key'] = apiKey;
      }

      // Try to call /flows endpoint
      const startTime = Date.now();
      const response = await axios.get(`${api.baseUrl}/flows`, {
        headers,
        timeout: api.timeout,
      });
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        status: response.status,
        responseTime,
        message: 'Connection successful',
      };
    } catch (error: any) {
      return {
        success: false,
        status: error.response?.status || 0,
        message: error.message,
      };
    }
  },

  /**
   * Share with users
   */
  async share(id: number, userId: number, userIds: number[], isAdmin: boolean = false) {
    const api = await prisma.mulesoftApi.findUnique({
      where: { id },
    });

    if (!api) {
      throw new Error('MuleSoft API not found');
    }

    // Allow sharing if owner OR admin
    if (api.createdBy !== userId && !isAdmin) {
      throw new Error('Not authorized');
    }

    // Normalize current sharedWith to array
    let currentSharedWith: number[] = [];
    if (api.sharedWith) {
      if (Array.isArray(api.sharedWith)) {
        currentSharedWith = api.sharedWith as number[];
      } else if (typeof api.sharedWith === 'object') {
        currentSharedWith = Object.values(api.sharedWith as any).filter((v: any) => typeof v === 'number');
      }
    }
    
    const newSharedWith = Array.from(new Set([...currentSharedWith, ...userIds]));

    return await prisma.mulesoftApi.update({
      where: { id },
      data: { sharedWith: newSharedWith },
    });
  },

  /**
   * Unshare
   */
  async unshare(id: number, userId: number, userIdToRemove: number, isAdmin: boolean = false) {
    const api = await prisma.mulesoftApi.findUnique({
      where: { id },
    });

    if (!api) {
      throw new Error('MuleSoft API not found');
    }

    // Allow unsharing if owner OR admin
    if (api.createdBy !== userId && !isAdmin) {
      throw new Error('Not authorized');
    }

    // Normalize current sharedWith to array
    let currentSharedWith: number[] = [];
    if (api.sharedWith) {
      if (Array.isArray(api.sharedWith)) {
        currentSharedWith = api.sharedWith as number[];
      } else if (typeof api.sharedWith === 'object') {
        currentSharedWith = Object.values(api.sharedWith as any).filter((v: any) => typeof v === 'number');
      }
    }

    const newSharedWith = currentSharedWith.filter(id => id !== userIdToRemove);

    return await prisma.mulesoftApi.update({
      where: { id },
      data: { sharedWith: newSharedWith },
    });
  },

  /**
   * Get shared users
   */
  async getSharedUsers(id: number, userId: number, isAdmin: boolean = false) {
    const api = await prisma.mulesoftApi.findUnique({
      where: { id },
    });

    if (!api) {
      throw new Error('MuleSoft API not found');
    }

    // Allow viewing shared users if owner OR admin
    if (api.createdBy !== userId && !isAdmin) {
      throw new Error('Not authorized');
    }

    // Normalize sharedWith to array
    let sharedWithIds: number[] = [];
    if (api.sharedWith) {
      if (Array.isArray(api.sharedWith)) {
        sharedWithIds = api.sharedWith as number[];
      } else if (typeof api.sharedWith === 'object') {
        sharedWithIds = Object.values(api.sharedWith as any).filter((v: any) => typeof v === 'number');
      }
    }

    if (sharedWithIds.length === 0) {
      return [];
    }

    return await prisma.user.findMany({
      where: {
        id: { in: sharedWithIds },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
  },

  /**
   * Mask secrets for APIs not owned by user
   */
  maskSecrets(apis: any[], userId: number) {
    return apis.map(api => {
      if (api.createdBy !== userId && api.authConfig) {
        const maskedConfig = { ...api.authConfig };
        Object.keys(maskedConfig).forEach(key => {
          if (typeof maskedConfig[key] === 'string') {
            maskedConfig[key] = '••••••••';
          }
        });
        return { ...api, authConfig: maskedConfig };
      }
      return api;
    });
  },

  /**
   * Decrypt API credentials
   */
  decryptApi(api: any) {
    if (!api.authConfig) {
      return api;
    }

    const decryptedConfig = { ...api.authConfig };
    
    try {
      if (api.authType === 'basic' && api.authConfig.username && api.authConfig.password) {
        decryptedConfig.username = encryption.decrypt(api.authConfig.username);
        decryptedConfig.password = encryption.decrypt(api.authConfig.password);
      } else if (api.authType === 'bearer' && api.authConfig.token) {
        decryptedConfig.token = encryption.decrypt(api.authConfig.token);
      } else if (api.authType === 'api_key' && api.authConfig.apiKey) {
        decryptedConfig.apiKey = encryption.decrypt(api.authConfig.apiKey);
      } else if (api.authType === 'oauth2' && api.authConfig.clientSecret) {
        decryptedConfig.clientSecret = encryption.decrypt(api.authConfig.clientSecret);
      }
    } catch (error) {
      logger.error('Failed to decrypt API credentials:', error);
    }

    return { ...api, authConfig: decryptedConfig };
  },

  /**
   * Create a new flow for an API
   */
  async createFlow(apiId: number, userId: number, flowData: any) {
    // Check if user has access to the API
    const api = await this.getById(apiId, userId);
    if (!api) {
      throw new Error('MuleSoft API not found or access denied');
    }

    // Only the owner can create flows
    if (api.userId !== userId) {
      throw new Error('Only the API owner can create flows');
    }

    // Check if flow with same name already exists
    const existingFlow = await prisma.mulesoftFlow.findFirst({
      where: {
        mulesoftApiId: apiId,
        name: flowData.name,
      },
    });

    if (existingFlow) {
      throw new Error('A flow with this name already exists for this API');
    }

    const flow = await prisma.mulesoftFlow.create({
      data: {
        mulesoftApiId: apiId,
        name: flowData.name,
        description: flowData.description,
        url: flowData.url,
        method: flowData.method || 'POST',
        vars: flowData.vars || [],
      },
    });

    logger.info(`Flow created: ${flow.name} for API ${apiId}`);
    return flow;
  },

  /**
   * Update a flow
   */
  async updateFlow(apiId: number, flowId: number, userId: number, flowData: any) {
    // Check if user has access to the API
    const api = await this.getById(apiId, userId);
    if (!api) {
      throw new Error('MuleSoft API not found or access denied');
    }

    // Only the owner can update flows
    if (api.userId !== userId) {
      throw new Error('Only the API owner can update flows');
    }

    // Check if flow exists and belongs to this API
    const existingFlow = await prisma.mulesoftFlow.findFirst({
      where: {
        id: flowId,
        mulesoftApiId: apiId,
      },
    });

    if (!existingFlow) {
      throw new Error('Flow not found');
    }

    // Check if new name conflicts with another flow
    if (flowData.name && flowData.name !== existingFlow.name) {
      const nameConflict = await prisma.mulesoftFlow.findFirst({
        where: {
          mulesoftApiId: apiId,
          name: flowData.name,
          id: { not: flowId },
        },
      });

      if (nameConflict) {
        throw new Error('A flow with this name already exists for this API');
      }
    }

    const flow = await prisma.mulesoftFlow.update({
      where: { id: flowId },
      data: {
        name: flowData.name,
        description: flowData.description,
        url: flowData.url,
        method: flowData.method,
        vars: flowData.vars || [],
      },
    });

    logger.info(`Flow updated: ${flow.name} (ID: ${flowId})`);
    return flow;
  },

  /**
   * Delete a flow
   */
  async deleteFlow(apiId: number, flowId: number, userId: number) {
    // Check if user has access to the API
    const api = await this.getById(apiId, userId);
    if (!api) {
      throw new Error('MuleSoft API not found or access denied');
    }

    // Only the owner can delete flows
    if (api.userId !== userId) {
      throw new Error('Only the API owner can delete flows');
    }

    // Check if flow exists and belongs to this API
    const existingFlow = await prisma.mulesoftFlow.findFirst({
      where: {
        id: flowId,
        mulesoftApiId: apiId,
      },
    });

    if (!existingFlow) {
      throw new Error('Flow not found');
    }

    await prisma.mulesoftFlow.delete({
      where: { id: flowId },
    });

    logger.info(`Flow deleted: ${existingFlow.name} (ID: ${flowId})`);
  },

  /**
   * Parse OpenAPI/RAML spec and return flow previews with duplicate detection
   */
  async parseFlowSpec(
    apiId: number,
    userId: number,
    input: { openApiSpec?: any; url?: string },
    isAdmin: boolean = false
  ): Promise<{ flows: FlowPreview[]; duplicates: string[] }> {
    // Check if user has access to the API
    const api = await this.getById(apiId, userId, isAdmin);
    if (!api) {
      throw new Error('MuleSoft API not found or access denied');
    }

    // Only the owner can import flows
    if (api.createdBy !== userId && !isAdmin) {
      throw new Error('Only the API owner can import flows');
    }

    try {
      let flows: FlowPreview[];

      if (input.url) {
        // Parse from URL
        flows = await flowOpenAPIImporter.parseFlowsFromUrl(input.url);
      } else if (input.openApiSpec) {
        // Parse from provided spec
        flows = await flowOpenAPIImporter.parseFlowsFromSpec(input.openApiSpec);
      } else {
        throw new Error('Either openApiSpec or url is required');
      }

      // Get existing flow names for duplicate detection
      const existingFlows = await prisma.mulesoftFlow.findMany({
        where: {
          mulesoftApiId: apiId,
          isActive: true,
        },
        select: {
          name: true,
        },
      });

      const existingNames = new Set(existingFlows.map(f => f.name));
      const duplicates = flows
        .filter(flow => existingNames.has(flow.name))
        .map(flow => flow.name);

      logger.info(`Parsed ${flows.length} flows from spec, ${duplicates.length} duplicates found`);

      return { flows, duplicates };
    } catch (error: any) {
      logger.error('Error parsing flow spec:', error);
      throw new Error(`Failed to parse flow spec: ${error.message}`);
    }
  },

  /**
   * Bulk create flows from parsed spec with duplicate handling
   */
  async bulkCreateFlows(
    apiId: number,
    userId: number,
    flows: FlowPreview[],
    duplicateAction: 'skip' | 'update' | 'cancel',
    isAdmin: boolean = false
  ): Promise<{ created: number; updated: number; skipped: number }> {
    // Check if user has access to the API
    const api = await this.getById(apiId, userId, isAdmin);
    if (!api) {
      throw new Error('MuleSoft API not found or access denied');
    }

    // Only the owner can import flows
    if (api.createdBy !== userId && !isAdmin) {
      throw new Error('Only the API owner can import flows');
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Get existing flow names
    const existingFlows = await prisma.mulesoftFlow.findMany({
      where: {
        mulesoftApiId: apiId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const existingFlowMap = new Map(existingFlows.map(f => [f.name, f.id]));

    // Check for duplicates if action is 'cancel'
    if (duplicateAction === 'cancel') {
      const duplicates = flows.filter(flow => existingFlowMap.has(flow.name));
      if (duplicates.length > 0) {
        throw new Error('Import cancelled due to duplicates');
      }
    }

    // Process each flow
    for (const flow of flows) {
      const isDuplicate = existingFlowMap.has(flow.name);

      if (isDuplicate && duplicateAction === 'skip') {
        skipped++;
        logger.info(`Skipping duplicate flow: ${flow.name}`);
        continue;
      }

      if (isDuplicate && duplicateAction === 'update') {
        // Update existing flow
        const flowId = existingFlowMap.get(flow.name)!;
        await prisma.mulesoftFlow.update({
          where: { id: flowId },
          data: {
            description: flow.description,
            url: flow.url,
            method: flow.method,
            vars: flow.vars,
          },
        });
        updated++;
        logger.info(`Updated flow: ${flow.name}`);
      } else {
        // Create new flow
        await prisma.mulesoftFlow.create({
          data: {
            mulesoftApiId: apiId,
            name: flow.name,
            description: flow.description,
            url: flow.url,
            method: flow.method,
            vars: flow.vars,
            isActive: true,
          },
        });
        created++;
        logger.info(`Created flow: ${flow.name}`);
      }
    }

    logger.info(`Bulk import complete: ${created} created, ${updated} updated, ${skipped} skipped`);

    return { created, updated, skipped };
  },
};

