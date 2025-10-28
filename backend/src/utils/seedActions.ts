import prisma from '../config/database';
import logger from './logger';

/**
 * Seed system actions and permissions
 */
export async function seedSystemActions() {
  try {
    logger.info('Seeding system actions...');

    // Get or create a system user for creating actions
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@dreamfields.com' },
    });

    if (!systemUser) {
      // Create system user
      systemUser = await prisma.user.create({
        data: {
          email: 'system@dreamfields.com',
          passwordHash: 'SYSTEM_USER_NO_PASSWORD',
          firstName: 'System',
          lastName: 'User',
          isActive: false, // System user cannot login
        },
      });
      logger.info('Created system user');
    }

    // Define system actions
    const systemActions = [
      {
        name: 'idp_extract',
        displayName: 'IDP Extract',
        description: 'Extract data from documents using MuleSoft IDP',
        actionType: 'system',
        category: 'idp',
        icon: 'FileText',
        color: '#3b82f6',
        configSchema: {
          type: 'object',
          properties: {
            jobId: { type: 'string', description: 'Optional job ID' },
          },
        },
        inputSchema: {
          type: 'object',
          properties: {
            idpExecutionId: { type: 'number', description: 'IDP Execution Configuration ID' },
            file: { type: 'string', description: 'File content in base64' },
            fileName: { type: 'string', description: 'File name' },
            documentType: { type: 'string', description: 'Document type (pdf, docx, etc)' },
          },
          required: ['idpExecutionId', 'file'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            jobId: { type: 'string' },
            uploadId: { type: 'number' },
            extractedData: { type: 'object' },
            status: { type: 'string' },
            documentName: { type: 'string' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'rest_api_call',
        displayName: 'REST API Call',
        description: 'Make HTTP requests to external APIs',
        actionType: 'system',
        category: 'api',
        icon: 'Network',
        color: '#ef4444',
        configSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'API URL' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'GET' },
            headers: { type: 'object', description: 'HTTP headers' },
            timeout: { type: 'number', default: 30000, description: 'Timeout in milliseconds' },
          },
          required: ['url'],
        },
        inputSchema: {
          type: 'object',
          properties: {
            body: { description: 'Request body' },
            params: { type: 'object', description: 'Query parameters' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            status: { type: 'number' },
            statusText: { type: 'string' },
            headers: { type: 'object' },
            data: { description: 'Response data' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'save_file',
        displayName: 'Save File',
        description: 'Save file content to storage',
        actionType: 'system',
        category: 'storage',
        icon: 'Save',
        color: '#10b981',
        configSchema: {
          type: 'object',
          properties: {
            storeType: { type: 'string', enum: ['database', 's3', 'ftp', 'local'], default: 'database' },
          },
        },
        inputSchema: {
          type: 'object',
          properties: {
            fileName: { type: 'string', description: 'File name' },
            fileContent: { description: 'File content (base64 or raw)' },
            fileType: { type: 'string', description: 'File type' },
            mimeType: { type: 'string', description: 'MIME type' },
          },
          required: ['fileName', 'fileContent'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            fileId: { type: 'number' },
            fileName: { type: 'string' },
            fileSize: { type: 'number' },
            storeType: { type: 'string' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'if_then_else',
        displayName: 'IF THEN ELSE',
        description: 'Conditional branching based on expression evaluation',
        actionType: 'system',
        category: 'control_flow',
        icon: 'GitBranch',
        color: '#f59e0b',
        configSchema: {
          type: 'object',
          properties: {
            condition: { description: 'Condition to evaluate (boolean or expression)' },
            trueValue: { description: 'Value returned when condition is true' },
            falseValue: { description: 'Value returned when condition is false' },
          },
          required: ['condition'],
        },
        inputSchema: {
          type: 'object',
          description: 'Data used for condition evaluation',
        },
        outputSchema: {
          type: 'object',
          properties: {
            conditionResult: { type: 'boolean' },
            selectedValue: { description: 'The value from the selected branch' },
            branchTaken: { type: 'string', enum: ['true', 'false'] },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'transform',
        displayName: 'Transform Data',
        description: 'Transform data using mappings or scripts',
        actionType: 'system',
        category: 'data',
        icon: 'RefreshCw',
        color: '#06b6d4',
        configSchema: {
          type: 'object',
          properties: {
            transformType: { type: 'string', enum: ['mapping', 'script', 'jsonpath'], default: 'mapping' },
            mapping: { type: 'object', description: 'Field mapping configuration' },
            script: { type: 'string', description: 'Transformation script' },
          },
        },
        inputSchema: {
          description: 'Data to transform',
        },
        outputSchema: {
          description: 'Transformed data',
        },
        executorType: 'builtin',
        executorConfig: {},
      },
    ];

    // Create or update system actions
    for (const actionData of systemActions) {
      const existing = await prisma.action.findUnique({
        where: { name: actionData.name },
      });

      if (existing) {
        await prisma.action.update({
          where: { name: actionData.name },
          data: {
            ...actionData,
            isSystem: true,
            isActive: true,
            createdBy: systemUser.id,
          },
        });
        logger.info(`Updated system action: ${actionData.name}`);
      } else {
        await prisma.action.create({
          data: {
            ...actionData,
            isSystem: true,
            isActive: true,
            createdBy: systemUser.id,
          },
        });
        logger.info(`Created system action: ${actionData.name}`);
      }
    }

    // Create permissions if they don't exist
    const permissions = [
      { name: 'actions.view', description: 'View actions', category: 'actions' },
      { name: 'actions.create', description: 'Create actions', category: 'actions' },
      { name: 'actions.edit_own', description: 'Edit own actions', category: 'actions' },
      { name: 'actions.edit_all', description: 'Edit all actions', category: 'actions' },
      { name: 'actions.delete_own', description: 'Delete own actions', category: 'actions' },
      { name: 'actions.delete_all', description: 'Delete all actions', category: 'actions' },
      { name: 'actions.share', description: 'Share actions', category: 'actions' },
      { name: 'actions.execute', description: 'Execute actions', category: 'actions' },
      
      { name: 'processes.view', description: 'View processes', category: 'processes' },
      { name: 'processes.create', description: 'Create processes', category: 'processes' },
      { name: 'processes.edit_own', description: 'Edit own processes', category: 'processes' },
      { name: 'processes.edit_all', description: 'Edit all processes', category: 'processes' },
      { name: 'processes.delete_own', description: 'Delete own processes', category: 'processes' },
      { name: 'processes.delete_all', description: 'Delete all processes', category: 'processes' },
      { name: 'processes.share', description: 'Share processes', category: 'processes' },
      { name: 'processes.execute', description: 'Execute processes', category: 'processes' },
      
      { name: 'executions.view_own', description: 'View own executions', category: 'executions' },
      { name: 'executions.view_all', description: 'View all executions', category: 'executions' },
      { name: 'executions.retry', description: 'Retry executions', category: 'executions' },
      { name: 'executions.cancel', description: 'Cancel executions', category: 'executions' },
      
      { name: 'connectors.view', description: 'View connectors', category: 'connectors' },
      { name: 'connectors.create', description: 'Create connectors', category: 'connectors' },
      { name: 'connectors.edit_own', description: 'Edit own connectors', category: 'connectors' },
      { name: 'connectors.edit_all', description: 'Edit all connectors', category: 'connectors' },
      { name: 'connectors.delete_own', description: 'Delete own connectors', category: 'connectors' },
      { name: 'connectors.delete_all', description: 'Delete all connectors', category: 'connectors' },
      
      { name: 'stores.view', description: 'View stores', category: 'stores' },
      { name: 'stores.create', description: 'Create stores', category: 'stores' },
      { name: 'stores.edit', description: 'Edit stores', category: 'stores' },
      { name: 'stores.delete', description: 'Delete stores', category: 'stores' },
    ];

    for (const permData of permissions) {
      const existing = await prisma.permission.findUnique({
        where: { name: permData.name },
      });

      if (!existing) {
        await prisma.permission.create({ data: permData });
        logger.info(`Created permission: ${permData.name}`);
      }
    }

    // Assign all action system permissions to admin role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' },
    });

    if (adminRole) {
      for (const permData of permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permData.name },
        });

        if (permission) {
          const existing = await prisma.rolePermission.findUnique({
            where: {
              roleId_permissionId: {
                roleId: adminRole.id,
                permissionId: permission.id,
              },
            },
          });

          if (!existing) {
            await prisma.rolePermission.create({
              data: {
                roleId: adminRole.id,
                permissionId: permission.id,
              },
            });
          }
        }
      }
      logger.info('Assigned all action permissions to admin role');
    }

    // Assign some permissions to user role
    const userRole = await prisma.role.findUnique({
      where: { name: 'user' },
    });

    if (userRole) {
      const userPermissions = [
        'actions.view', 'actions.create', 'actions.edit_own', 'actions.delete_own', 'actions.share', 'actions.execute',
        'processes.view', 'processes.create', 'processes.edit_own', 'processes.delete_own', 'processes.share', 'processes.execute',
        'executions.view_own', 'executions.retry', 'executions.cancel',
        'connectors.view', 'connectors.create', 'connectors.edit_own', 'connectors.delete_own',
        'stores.view', 'stores.create', 'stores.edit', 'stores.delete',
      ];

      for (const permName of userPermissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permName },
        });

        if (permission) {
          const existing = await prisma.rolePermission.findUnique({
            where: {
              roleId_permissionId: {
                roleId: userRole.id,
                permissionId: permission.id,
              },
            },
          });

          if (!existing) {
            await prisma.rolePermission.create({
              data: {
                roleId: userRole.id,
                permissionId: permission.id,
              },
            });
          }
        }
      }
      logger.info('Assigned action permissions to user role');
    }

    logger.info('System actions and permissions seeded successfully!');
  } catch (error: any) {
    logger.error('Error seeding system actions:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedSystemActions()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

