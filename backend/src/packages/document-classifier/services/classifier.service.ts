import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import prisma from '../../../config/database';
import { getMuleSoftConfig, MuleSoftConfig } from '../../../config/muleSoft';
import {
  ClassificationRequest,
  ClassificationResponse,
  DocumentType,
} from '../types/document-classifier.types';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const FALLBACK_ENDPOINT = '/v1/chat/completions';
const DOCUMENT_CLASSIFIER_CATEGORY = 'document_classifier';

/**
 * AI Classifier Service
 * Uses MuleSoft LLM Inference API (OpenAI-compatible)
 */
export class ClassifierService {
  private configPromise: Promise<MuleSoftConfig>;

  private clientPromise: Promise<AxiosInstance>;

  constructor() {
    this.configPromise = getMuleSoftConfig();
    this.clientPromise = this.createClient();
  }

  /**
   * Reuse the same MuleSoft endpoint resolution used across services.
   */
  private async getChatEndpoint(): Promise<string> {
    const config = await this.configPromise;
    const endpoint = config.endpoints?.llmChatCompletions || FALLBACK_ENDPOINT;
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }

  private async createClient(): Promise<AxiosInstance> {
    const config = await this.configPromise;
    const axiosConfig: AxiosRequestConfig = {
      baseURL: config.baseUrl,
      timeout: config.timeout || 180000,
      headers: { 'Content-Type': 'application/json' },
    };

    if (config.username && config.password) {
      axiosConfig.auth = {
        username: config.username,
        password: config.password,
      };
    }

    return axios.create(axiosConfig);
  }

  async classifyDocument(request: ClassificationRequest): Promise<ClassificationResponse> {
    const { extractedText, pageNumber, textLength } = request;

    if (textLength < 20) {
      return {
        documentType: textLength === 0 ? 'blank' : 'unknown',
        confidence: textLength === 0 ? 100 : 50,
        reasoning: textLength === 0 ? 'No text found on page' : 'Insufficient text for classification',
      };
    }

    try {
      const client = await this.clientPromise;
      const endpoint = await this.getChatEndpoint();
      const prompt = await this.buildPrompt(extractedText, pageNumber);

      const response = await client.post(endpoint, {
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      });

      const content = response.data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in MuleSoft API response');
      }

      return this.parseResponse(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown classification error';
      // eslint-disable-next-line no-console
      console.error('Classification error:', message);
      return {
        documentType: 'unknown',
        confidence: 0,
        reasoning: `Classification failed: ${message}`,
      };
    }
  }

  private async buildPrompt(text: string, pageNumber: number): Promise<string> {
    const truncatedText = text.length > 2000 ? `${text.substring(0, 2000)}...(truncated)` : text;
    const template = await this.getPromptTemplate();

    return template
      .replace(/\{\{\s*page_number\s*\}\}/gi, String(pageNumber))
      .replace(/\{\{\s*extracted_text\s*\}\}/gi, truncatedText)
      .replace(
        /\{\{\s*document_types\s*\}\}/gi,
        `- purchase_order: Purchase orders, POs
- invoice: Invoices, bills
- contract: Contracts, agreements, terms
- receipt: Receipts, payment confirmations
- form: Forms, applications, questionnaires
- report: Reports, analyses, summaries
- letter: Letters, correspondence
- product_list: Product lists, catalogs, inventory
- image: Mostly images with minimal text
- table: Primarily tables or data grids
- blank: Empty or nearly empty pages
- unknown: Cannot determine type`
      )
      .replace(
        /\{\{\s*response_format\s*\}\}/gi,
        `{
  "documentType": "one of the types above",
  "confidence": 0-100,
  "reasoning": "brief explanation",
  "suggestedFields": ["field1", "field2"] (optional)
}`
      );
  }

  /**
   * Load prompt template from DB (prompts table) so it can be edited.
   * Falls back to the built-in template if none is configured.
   */
  private async getPromptTemplate(): Promise<string> {
    try {
      const prompt = await prisma.prompt.findFirst({
        where: {
          category: DOCUMENT_CLASSIFIER_CATEGORY,
          isActive: true,
        },
        orderBy: [
          { isDefault: 'desc' },
          { updatedAt: 'desc' },
        ],
      });

      if (prompt?.content) {
        return prompt.content;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load document classifier prompt, using default:', error);
    }

    // Default template mirrors previous inline prompt
    return `You are a document classification expert. Analyze the following text extracted from page {{page_number}} of a document and classify it.

DOCUMENT TYPES:
{{document_types}}

EXTRACTED TEXT:
{{extracted_text}}

Respond in JSON format:
{{response_format}}`;
  }

  private parseResponse(responseText: string): ClassificationResponse {
    try {
      let cleanText = responseText.trim();

      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanText);

      const documentType = (parsed.documentType || 'unknown') as DocumentType;
      const confidence = Math.min(100, Math.max(0, parsed.confidence || 0));

      return {
        documentType,
        confidence,
        reasoning: parsed.reasoning,
        suggestedFields: parsed.suggestedFields,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse classification response:', error);
      return {
        documentType: 'unknown',
        confidence: 0,
        reasoning: 'Failed to parse AI response',
      };
    }
  }

  async classifyBatch(requests: ClassificationRequest[]): Promise<ClassificationResponse[]> {
    // eslint-disable-next-line no-console
    console.log(`Classifying ${requests.length} pages...`);

    const batchSize = 5;
    const results: ClassificationResponse[] = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((req) => this.classifyDocument(req)));
      results.push(...batchResults);
    }

    return results;
  }
}

