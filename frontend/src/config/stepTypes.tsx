import {
  Upload,
  FileSearch,
  Zap,
  Eye,
  BarChart,
  Database,
  LucideIcon,
} from 'lucide-react';

/**
 * Step Type Configuration for Frontend
 * 
 * Defines UI components and rendering for each step type
 */

export interface StepTypeConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category: 'input' | 'processing' | 'review' | 'output' | 'integration';
  requiresUserInput: boolean;
  modalComponent?: string;
  configFields: ConfigField[];
}

export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'json';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: any;
  description?: string;
}

export const STEP_TYPES: Record<string, StepTypeConfig> = {
  file_upload: {
    id: 'file_upload',
    name: 'File Upload',
    description: 'Upload and validate files',
    icon: Upload,
    color: 'bg-blue-500',
    category: 'input',
    requiresUserInput: true,
    modalComponent: 'FileUploadModal',
    configFields: [
      {
        name: 'acceptedFileTypes',
        label: 'Accepted File Types',
        type: 'multiselect',
        options: [
          { value: 'pdf', label: 'PDF' },
          { value: 'xlsx', label: 'Excel (XLSX)' },
          { value: 'csv', label: 'CSV' },
          { value: 'docx', label: 'Word (DOCX)' },
        ],
        defaultValue: ['pdf', 'xlsx', 'csv'],
        description: 'Select which file types are allowed',
      },
      {
        name: 'maxFileSize',
        label: 'Max File Size (MB)',
        type: 'number',
        defaultValue: 10,
        description: 'Maximum file size in megabytes',
      },
    ],
  },

  idp_process: {
    id: 'idp_process',
    name: 'IDP Process',
    description: 'Extract data using IDP',
    icon: FileSearch,
    color: 'bg-purple-500',
    category: 'processing',
    requiresUserInput: false,
    configFields: [
      {
        name: 'documentType',
        label: 'Document Type',
        type: 'select',
        required: true,
        options: [
          { value: 'contract', label: 'Contract' },
          { value: 'invoice', label: 'Invoice' },
          { value: 'receipt', label: 'Receipt' },
          { value: 'form', label: 'Form' },
        ],
        defaultValue: 'contract',
      },
      {
        name: 'inputSource',
        label: 'Input Source',
        type: 'text',
        placeholder: 'previous_step or step_1_output',
        defaultValue: 'previous_step',
        description: 'Where to get the file from',
      },
    ],
  },

  api_call: {
    id: 'api_call',
    name: 'API Call',
    description: 'Call external APIs',
    icon: Zap,
    color: 'bg-yellow-500',
    category: 'integration',
    requiresUserInput: false,
    configFields: [
      {
        name: 'method',
        label: 'HTTP Method',
        type: 'select',
        required: true,
        options: [
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'PATCH', label: 'PATCH' },
          { value: 'DELETE', label: 'DELETE' },
        ],
        defaultValue: 'POST',
      },
      {
        name: 'url',
        label: 'API URL',
        type: 'text',
        required: true,
        placeholder: 'https://api.example.com/endpoint',
        description: 'Supports {{variable}} syntax',
      },
      {
        name: 'headers',
        label: 'Headers (JSON)',
        type: 'json',
        defaultValue: { 'Content-Type': 'application/json' },
      },
      {
        name: 'body',
        label: 'Request Body (JSON)',
        type: 'json',
        description: 'Supports {{variable}} syntax',
      },
    ],
  },

  review: {
    id: 'review',
    name: 'Review',
    description: 'Manual review step',
    icon: Eye,
    color: 'bg-orange-500',
    category: 'review',
    requiresUserInput: true,
    modalComponent: 'ReviewModal',
    configFields: [
      {
        name: 'reviewType',
        label: 'Review Type',
        type: 'select',
        options: [
          { value: 'manual', label: 'Manual Review' },
          { value: 'conversational', label: 'Conversational AI' },
        ],
        defaultValue: 'manual',
      },
      {
        name: 'instructions',
        label: 'Instructions',
        type: 'textarea',
        placeholder: 'Enter instructions for the reviewer...',
        defaultValue: 'Please review the data and approve or reject',
      },
      {
        name: 'inputSource',
        label: 'Data to Review',
        type: 'text',
        placeholder: 'previous_step or step_3_output',
        defaultValue: 'previous_step',
      },
    ],
  },

  analyze: {
    id: 'analyze',
    name: 'Data Analysis',
    description: 'Analyze and transform data',
    icon: BarChart,
    color: 'bg-green-500',
    category: 'processing',
    requiresUserInput: false,
    configFields: [
      {
        name: 'analysisType',
        label: 'Analysis Type',
        type: 'select',
        required: true,
        options: [
          { value: 'contract', label: 'Contract Analysis' },
          { value: 'data', label: 'Data Analysis' },
          { value: 'custom', label: 'Custom Flow' },
        ],
        defaultValue: 'contract',
      },
      {
        name: 'flowName',
        label: 'Flow Name (for custom)',
        type: 'text',
        placeholder: 'analyze-contract',
        description: 'Required for custom analysis type',
      },
      {
        name: 'inputSource',
        label: 'Input Source',
        type: 'text',
        placeholder: 'previous_step or step_3_output',
        defaultValue: 'previous_step',
      },
    ],
  },

  store: {
    id: 'store',
    name: 'Store Data',
    description: 'Save data to storage',
    icon: Database,
    color: 'bg-indigo-500',
    category: 'output',
    requiresUserInput: false,
    configFields: [
      {
        name: 'storageType',
        label: 'Storage Type',
        type: 'select',
        required: true,
        options: [
          { value: 'database', label: 'Database' },
          { value: 'file', label: 'File' },
          { value: 'custom_store', label: 'Custom Store' },
        ],
        defaultValue: 'database',
      },
      {
        name: 'tableName',
        label: 'Table Name (for database)',
        type: 'text',
        placeholder: 'analysis_records',
        defaultValue: 'analysis_records',
      },
      {
        name: 'filename',
        label: 'Filename (for file)',
        type: 'text',
        placeholder: 'output.json',
      },
      {
        name: 'inputSource',
        label: 'Data to Store',
        type: 'text',
        placeholder: 'previous_step or step_5_output',
        defaultValue: 'previous_step',
      },
    ],
  },
};

/**
 * Get step type config by ID
 */
export function getStepType(stepTypeId: string): StepTypeConfig | undefined {
  return STEP_TYPES[stepTypeId];
}

/**
 * Get all step types
 */
export function getAllStepTypes(): StepTypeConfig[] {
  return Object.values(STEP_TYPES);
}

/**
 * Get step types by category
 */
export function getStepTypesByCategory(category: string): StepTypeConfig[] {
  return Object.values(STEP_TYPES).filter(st => st.category === category);
}








