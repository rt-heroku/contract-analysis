import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * LLM Connector Configuration
 */
export interface LLMConnectorConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  apiKey?: string;
  timeout?: number;
  endpoints?: {
    llmChatCompletions?: string;
    completion?: string;
  };
}

/**
 * LLM Connector
 * Provides a unified interface to LLM APIs (OpenAI-compatible)
 * 
 * Can be used as a standalone connector or integrated with a connector executor pattern.
 */
export class LLMConnector {
  private client: AxiosInstance;
  private config: LLMConnectorConfig;

  constructor(config: LLMConnectorConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  /**
   * Create HTTP client with authentication
   */
  private createClient(): AxiosInstance {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout || 180000,
      headers: { 'Content-Type': 'application/json' },
    };

    // Basic Authentication (MuleSoft style)
    if (this.config.username && this.config.password) {
      axiosConfig.auth = {
        username: this.config.username,
        password: this.config.password,
      };
    }

    // Bearer Token Authentication (OpenAI style)
    if (this.config.apiKey) {
      axiosConfig.headers = {
        ...axiosConfig.headers,
        'Authorization': `Bearer ${this.config.apiKey}`,
      };
    }

    return axios.create(axiosConfig);
  }

  /**
   * Chat Completion
   * OpenAI-compatible chat completion endpoint
   */
  async chatCompletion(params: {
    model: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    stop?: string | string[];
  }): Promise<{
    content: string;
    usage?: any;
    model?: string;
    finishReason?: string;
  }> {
    const endpoint = this.config.endpoints?.llmChatCompletions || '/v1/chat/completions';

    const response = await this.client.post(endpoint, {
      model: params.model,
      messages: params.messages,
      max_tokens: params.max_tokens || 500,
      temperature: params.temperature || 0.1,
      top_p: params.top_p,
      n: params.n,
      stream: params.stream,
      stop: params.stop,
    });

    // Handle different response formats
    const data = response.data;
    
    // OpenAI standard format
    if (data.choices?.[0]?.message?.content) {
      return {
        content: data.choices[0].message.content,
        usage: data.usage,
        model: data.model,
        finishReason: data.choices[0].finish_reason,
      };
    }

    // MuleSoft simple format
    if (data.response) {
      return {
        content: typeof data.response === 'string' ? data.response : JSON.stringify(data.response),
        usage: data.usage,
        model: data.model,
      };
    }

    // Direct content
    if (data.content) {
      return {
        content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
      };
    }

    // Fallback
    throw new Error('Unexpected response format from LLM API');
  }

  /**
   * Text Completion
   * OpenAI-compatible text completion endpoint
   */
  async completion(params: {
    model: string;
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    stop?: string | string[];
  }): Promise<{
    content: string;
    usage?: any;
    model?: string;
  }> {
    const endpoint = this.config.endpoints?.completion || '/v1/completions';

    const response = await this.client.post(endpoint, {
      model: params.model,
      prompt: params.prompt,
      max_tokens: params.max_tokens || 500,
      temperature: params.temperature || 0.1,
      top_p: params.top_p,
      n: params.n,
      stream: params.stream,
      stop: params.stop,
    });

    const data = response.data;

    // OpenAI format
    if (data.choices?.[0]?.text) {
      return {
        content: data.choices[0].text,
        usage: data.usage,
        model: data.model,
      };
    }

    // Simple format
    if (data.response) {
      return {
        content: typeof data.response === 'string' ? data.response : JSON.stringify(data.response),
      };
    }

    throw new Error('Unexpected response format from LLM API');
  }

  /**
   * Test connection to LLM API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.chatCompletion({
        model: 'claude-sonnet-4',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10,
      });
      return true;
    } catch (error) {
      console.error('LLM connection test failed:', error);
      return false;
    }
  }
}

export default LLMConnector;


