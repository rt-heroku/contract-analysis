/**
 * LLM Models Configuration
 * Comprehensive list of available LLM models from major providers
 */

export interface LLMModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'cohere' | 'huggingface' | 'ollama' | 'azure_openai';
  contextWindow: number;
  maxOutput?: number;
  supportsFunctions?: boolean;
  supportsVision?: boolean;
  supportsStreaming?: boolean;
  costPer1kTokens?: {
    input: number;
    output: number;
  };
  description?: string;
}

export const LLM_MODELS: LLMModel[] = [
  // OpenAI Models
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    contextWindow: 128000,
    maxOutput: 4096,
    supportsFunctions: true,
    supportsVision: true,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.01, output: 0.03 },
    description: 'Most capable GPT-4 model with vision support'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    contextWindow: 8192,
    maxOutput: 8192,
    supportsFunctions: true,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.03, output: 0.06 },
    description: 'Standard GPT-4 model'
  },
  {
    id: 'gpt-4-32k',
    name: 'GPT-4 32K',
    provider: 'openai',
    contextWindow: 32768,
    maxOutput: 32768,
    supportsFunctions: true,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.06, output: 0.12 },
    description: 'Extended context GPT-4'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    contextWindow: 16385,
    maxOutput: 4096,
    supportsFunctions: true,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.0005, output: 0.0015 },
    description: 'Fast and cost-effective model'
  },
  {
    id: 'gpt-3.5-turbo-16k',
    name: 'GPT-3.5 Turbo 16K',
    provider: 'openai',
    contextWindow: 16385,
    maxOutput: 16385,
    supportsFunctions: true,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.003, output: 0.004 },
    description: 'Extended context GPT-3.5'
  },

  // Anthropic Claude Models
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutput: 4096,
    supportsVision: true,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.015, output: 0.075 },
    description: 'Most powerful Claude model'
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutput: 4096,
    supportsVision: true,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    description: 'Balanced performance and cost'
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutput: 4096,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.00025, output: 0.00125 },
    description: 'Fast and efficient Claude model'
  },
  {
    id: 'claude-2.1',
    name: 'Claude 2.1',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutput: 4096,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.008, output: 0.024 },
    description: 'Previous generation Claude'
  },

  // Google Models
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    contextWindow: 1000000,
    maxOutput: 8192,
    supportsFunctions: true,
    supportsVision: true,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.0035, output: 0.0105 },
    description: 'Advanced multimodal model with massive context'
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    contextWindow: 32768,
    maxOutput: 8192,
    supportsFunctions: true,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.0005, output: 0.0015 },
    description: 'Standard Gemini model'
  },
  {
    id: 'gemini-pro-vision',
    name: 'Gemini Pro Vision',
    provider: 'google',
    contextWindow: 16384,
    maxOutput: 2048,
    supportsVision: true,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.00025, output: 0.0005 },
    description: 'Multimodal vision model'
  },

  // Cohere Models
  {
    id: 'command-r-plus',
    name: 'Command R+',
    provider: 'cohere',
    contextWindow: 128000,
    maxOutput: 4000,
    supportsFunctions: true,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    description: 'Advanced RAG-optimized model'
  },
  {
    id: 'command-r',
    name: 'Command R',
    provider: 'cohere',
    contextWindow: 128000,
    maxOutput: 4000,
    supportsFunctions: true,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.0005, output: 0.0015 },
    description: 'Efficient RAG model'
  },
  {
    id: 'command',
    name: 'Command',
    provider: 'cohere',
    contextWindow: 4096,
    maxOutput: 4000,
    supportsStreaming: true,
    costPer1kTokens: { input: 0.001, output: 0.002 },
    description: 'General purpose model'
  },

  // Azure OpenAI (same models as OpenAI but deployed on Azure)
  {
    id: 'azure-gpt-4-turbo',
    name: 'Azure GPT-4 Turbo',
    provider: 'azure_openai',
    contextWindow: 128000,
    maxOutput: 4096,
    supportsFunctions: true,
    supportsVision: true,
    supportsStreaming: true,
    description: 'GPT-4 Turbo on Azure'
  },
  {
    id: 'azure-gpt-4',
    name: 'Azure GPT-4',
    provider: 'azure_openai',
    contextWindow: 8192,
    maxOutput: 8192,
    supportsFunctions: true,
    supportsStreaming: true,
    description: 'GPT-4 on Azure'
  },
  {
    id: 'azure-gpt-35-turbo',
    name: 'Azure GPT-3.5 Turbo',
    provider: 'azure_openai',
    contextWindow: 16385,
    maxOutput: 4096,
    supportsFunctions: true,
    supportsStreaming: true,
    description: 'GPT-3.5 Turbo on Azure'
  },

  // Ollama (local models)
  {
    id: 'llama2',
    name: 'Llama 2',
    provider: 'ollama',
    contextWindow: 4096,
    maxOutput: 2048,
    supportsStreaming: true,
    description: 'Meta Llama 2 (run locally)'
  },
  {
    id: 'mistral',
    name: 'Mistral',
    provider: 'ollama',
    contextWindow: 8192,
    maxOutput: 4096,
    supportsStreaming: true,
    description: 'Mistral 7B (run locally)'
  },
  {
    id: 'mixtral',
    name: 'Mixtral',
    provider: 'ollama',
    contextWindow: 32768,
    maxOutput: 8192,
    supportsStreaming: true,
    description: 'Mixtral 8x7B (run locally)'
  },
  {
    id: 'codellama',
    name: 'Code Llama',
    provider: 'ollama',
    contextWindow: 16384,
    maxOutput: 4096,
    supportsStreaming: true,
    description: 'Code-specialized Llama (run locally)'
  },
];

export const LLM_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', requiresApiKey: true, baseUrl: 'https://api.openai.com/v1' },
  { id: 'anthropic', name: 'Anthropic (Claude)', requiresApiKey: true, baseUrl: 'https://api.anthropic.com/v1' },
  { id: 'google', name: 'Google (Gemini)', requiresApiKey: true, baseUrl: 'https://generativelanguage.googleapis.com/v1' },
  { id: 'cohere', name: 'Cohere', requiresApiKey: true, baseUrl: 'https://api.cohere.ai/v1' },
  { id: 'azure_openai', name: 'Azure OpenAI', requiresApiKey: true, baseUrl: '' }, // Custom base URL
  { id: 'ollama', name: 'Ollama (Local)', requiresApiKey: false, baseUrl: 'http://localhost:11434' },
  { id: 'huggingface', name: 'Hugging Face', requiresApiKey: true, baseUrl: 'https://api-inference.huggingface.co/models' },
] as const;

export function getModelsByProvider(providerId: string): LLMModel[] {
  return LLM_MODELS.filter(model => model.provider === providerId);
}

export function getModelById(modelId: string): LLMModel | undefined {
  return LLM_MODELS.find(model => model.id === modelId);
}

