/**
 * Step Type Definitions
 * 
 * Defines all available step types for the workflow builder
 */

export interface StepTypeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'input' | 'processing' | 'review' | 'output' | 'integration';
  handler: string;
  requiresUserInput: boolean;
  modalComponent?: string;
  configSchema: any; // JSON Schema for configuration
  defaultConfig: any;
}

export const STEP_TYPES: Record<string, StepTypeDefinition> = {
  file_upload: {
    id: 'file_upload',
    name: 'File Upload',
    description: 'Upload and validate files (PDF, Excel, CSV)',
    icon: 'Upload',
    category: 'input',
    handler: 'FileUploadHandler',
    requiresUserInput: true,
    modalComponent: 'FileUploadModal',
    configSchema: {
      type: 'object',
      properties: {
        acceptedFileTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Accepted file types (e.g., pdf, xlsx, csv)',
        },
        maxFileSize: {
          type: 'number',
          description: 'Maximum file size in bytes',
        },
        required: {
          type: 'boolean',
          description: 'Whether file upload is required',
        },
      },
    },
    defaultConfig: {
      acceptedFileTypes: ['pdf', 'xlsx', 'csv'],
      maxFileSize: 10485760, // 10MB
      required: true,
    },
  },

  idp_process: {
    id: 'idp_process',
    name: 'IDP Process',
    description: 'Extract data from documents using IDP',
    icon: 'FileSearch',
    category: 'processing',
    handler: 'IdpProcessHandler',
    requiresUserInput: false,
    configSchema: {
      type: 'object',
      properties: {
        documentType: {
          type: 'string',
          enum: ['contract', 'invoice', 'receipt', 'form'],
          description: 'Type of document to process',
        },
        idpConfig: {
          type: 'object',
          description: 'Additional IDP configuration',
        },
      },
      required: ['documentType'],
    },
    defaultConfig: {
      documentType: 'contract',
      idpConfig: {},
    },
  },

  api_call: {
    id: 'api_call',
    name: 'API Call',
    description: 'Call external APIs (REST, MuleSoft flows)',
    icon: 'Zap',
    category: 'integration',
    handler: 'ApiCallHandler',
    requiresUserInput: false,
    configSchema: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          description: 'HTTP method',
        },
        url: {
          type: 'string',
          description: 'API endpoint URL (supports {{variable}} syntax)',
        },
        headers: {
          type: 'object',
          description: 'HTTP headers',
        },
        body: {
          type: 'object',
          description: 'Request body (supports {{variable}} syntax)',
        },
        timeout: {
          type: 'number',
          description: 'Request timeout in milliseconds',
        },
      },
      required: ['url'],
    },
    defaultConfig: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    },
  },

  review: {
    id: 'review',
    name: 'Review',
    description: 'Manual review or conversational interaction',
    icon: 'Eye',
    category: 'review',
    handler: 'ReviewHandler',
    requiresUserInput: true,
    modalComponent: 'ReviewModal',
    configSchema: {
      type: 'object',
      properties: {
        reviewType: {
          type: 'string',
          enum: ['manual', 'conversational'],
          description: 'Type of review',
        },
        instructions: {
          type: 'string',
          description: 'Instructions for the reviewer',
        },
      },
    },
    defaultConfig: {
      reviewType: 'manual',
      instructions: 'Please review the data and approve or reject',
    },
  },

  analyze: {
    id: 'analyze',
    name: 'Data Analysis',
    description: 'Analyze and transform data',
    icon: 'BarChart',
    category: 'processing',
    handler: 'AnalyzeHandler',
    requiresUserInput: false,
    configSchema: {
      type: 'object',
      properties: {
        analysisType: {
          type: 'string',
          enum: ['contract', 'data', 'custom'],
          description: 'Type of analysis to perform',
        },
        flowName: {
          type: 'string',
          description: 'Custom flow name (for custom analysis)',
        },
        analysisConfig: {
          type: 'object',
          description: 'Additional analysis configuration',
        },
      },
      required: ['analysisType'],
    },
    defaultConfig: {
      analysisType: 'contract',
      analysisConfig: {},
    },
  },

  store: {
    id: 'store',
    name: 'Store Data',
    description: 'Save data to database, file, or storage',
    icon: 'Database',
    category: 'output',
    handler: 'StoreHandler',
    requiresUserInput: false,
    configSchema: {
      type: 'object',
      properties: {
        storageType: {
          type: 'string',
          enum: ['database', 'file', 'custom_store'],
          description: 'Where to store the data',
        },
        tableName: {
          type: 'string',
          description: 'Database table name (for database storage)',
        },
        filename: {
          type: 'string',
          description: 'Output filename (for file storage)',
        },
        storeId: {
          type: 'number',
          description: 'Store ID (for custom store)',
        },
      },
      required: ['storageType'],
    },
    defaultConfig: {
      storageType: 'database',
      tableName: 'analysis_records',
    },
  },
};

/**
 * Get step type definition by ID
 */
export function getStepType(stepTypeId: string): StepTypeDefinition | undefined {
  return STEP_TYPES[stepTypeId];
}

/**
 * Get all step types
 */
export function getAllStepTypes(): StepTypeDefinition[] {
  return Object.values(STEP_TYPES);
}

/**
 * Get step types by category
 */
export function getStepTypesByCategory(category: string): StepTypeDefinition[] {
  return Object.values(STEP_TYPES).filter(st => st.category === category);
}





