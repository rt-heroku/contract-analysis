import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import tableAnalysisService from './tableAnalysis.service';

const prisma = new PrismaClient();

class AIAnalysisService {
  /**
   * Analyze table using AI with connector architecture
   */
  async analyzeTable(
    connectorId: number,
    userId: number,
    schemaName: string,
    tableName: string,
    analysisType: 'health_check' | 'performance_optimization' = 'health_check',
    customPrompt?: string
  ) {
    logger.info(`Starting AI analysis for ${schemaName}.${tableName} (type: ${analysisType})`);

    // Step 1: Get inference connector
    const inferenceConnector = await prisma.connector.findFirst({
      where: {
        connectorType: 'inference',
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!inferenceConnector) {
      throw new Error('No active inference connector found. Please configure an AI provider in Connectors.');
    }

    const config = inferenceConnector.config as any;
    logger.info(`Using inference connector: ${inferenceConnector.name} (ID: ${inferenceConnector.id})`);

    if (!config.apiKey) {
      throw new Error('Inference connector is missing API key configuration');
    }

    // Step 2: Aggregate table context
    const context = await tableAnalysisService.aggregateTableContext(
      connectorId,
      userId,
      schemaName,
      tableName
    );

    // Step 3: Detect scenario (if not using custom prompt)
    let scenario: any;
    let prompt: any;
    
    if (customPrompt) {
      // Use custom prompt directly
      scenario = 'CUSTOM';
      prompt = { promptTemplate: customPrompt };
    } else if (analysisType === 'performance_optimization') {
      // Detect scenario and get appropriate prompt
      scenario = tableAnalysisService.detectScenario(context);
      logger.info(`Detected scenario: ${scenario}`);
      prompt = await tableAnalysisService.getPromptForScenario(scenario);
    } else {
      // Default to general health check
      scenario = 'GENERAL_HEALTH';
      prompt = await tableAnalysisService.getPromptForScenario(scenario);
    }

    // Step 4: Render prompt with context
    const renderedPrompt = tableAnalysisService.renderAnalysisPrompt(
      prompt.promptTemplate,
      context
    );

    logger.debug('Rendered prompt length:', renderedPrompt.length);

    // Step 5: Call AI API via connector
    const aiResponse = await this.callAI(
      inferenceConnector,
      renderedPrompt,
      prompt.processingConfig || {}
    );

    logger.info('AI analysis completed successfully');

    // Step 6: Store result
    const analysisResult = await tableAnalysisService.storeAnalysisResult(
      connectorId,
      userId,
      schemaName,
      tableName,
      analysisType,
      scenario,
      context,
      aiResponse
    );

    // Parse AI response to extract summary and recommendations
    let parsedResponse: any = {};
    let isMarkdown = false;
    
    try {
      // First, try to extract JSON from markdown code blocks if present
      const cleanedResponse = this.extractJsonFromMarkdown(aiResponse);
      parsedResponse = typeof cleanedResponse === 'string' ? JSON.parse(cleanedResponse) : cleanedResponse;
      logger.info('Parsed AI response as JSON successfully');
    } catch (e) {
      // If parsing fails, treat as markdown
      logger.warn('AI response is not JSON, treating as markdown');
      logger.info('Raw AI response (first 500 chars):', aiResponse.substring(0, 500));
      isMarkdown = true;
      parsedResponse = { 
        markdown: aiResponse,
        raw: aiResponse 
      };
    }

    const healthScore = analysisResult.healthScore || parsedResponse.health_score;
    const summary = isMarkdown 
      ? 'View full markdown report below' 
      : (parsedResponse.summary || parsedResponse.analysis || 'No summary available');
    const recommendations = isMarkdown 
      ? [] 
      : (parsedResponse.recommendations || analysisResult.recommendations || []);

    logger.info(`Analysis result: isMarkdown=${isMarkdown}, healthScore=${healthScore}, scenario=${scenario}, summary length=${summary.length}`);

    return {
      id: analysisResult.id,
      scenarioDetected: scenario,
      healthScore,
      summary,
      recommendations: Array.isArray(recommendations) ? recommendations : [],
      rawResponse: parsedResponse,
      isMarkdown,
      markdownContent: isMarkdown ? aiResponse : null,
      createdAt: analysisResult.createdAt,
    };
  }

  /**
   * Extract JSON from markdown code blocks if present
   */
  private extractJsonFromMarkdown(text: string): string {
    // If it starts with {, it's already JSON
    if (text.trim().startsWith('{')) {
      return text;
    }

    // Try to extract from markdown code block
    const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      logger.info('Extracted JSON from markdown code block');
      return jsonBlockMatch[1].trim();
    }

    // Try to find JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      logger.info('Extracted JSON object from text');
      return jsonMatch[0];
    }

    // Return as-is and let JSON.parse fail
    return text;
  }

  /**
   * Call AI API using connector configuration
   */
  private async callAI(
    connector: any,
    prompt: string,
    processingConfig: any
  ): Promise<string> {
    const config = connector.config as any;

    // Build API URL
    let baseUrl = (config.baseUrl || 'https://api.openai.com/v1').trim();
    baseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
    
    const endpoint = config.endpoint || '/chat/completions';
    const apiUrl = `${baseUrl}${endpoint}`;
    
    logger.info(`Calling AI API: ${apiUrl} with model: ${config.modelId || 'gpt-4'}`);

    // Build messages with system message to enforce JSON output
    const messages = [
      {
        role: 'system',
        content: 'You are a PostgreSQL database performance expert. You must respond ONLY with valid JSON. Do not include markdown formatting, code blocks, or any text outside the JSON object. Your response must be parseable by JSON.parse().',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    // Call AI API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelId || 'gpt-4',
        messages,
        temperature: processingConfig.temperature || 0.2,
        max_tokens: processingConfig.max_tokens || 3000,
        response_format: processingConfig.response_format === 'json' 
          ? { type: 'json_object' } 
          : undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`AI API error (${response.status}): ${errorText}`);
      throw new Error(`AI API error (${response.status}): ${errorText}`);
    }

    const responseData: any = await response.json();
    const generatedText: string = responseData.choices[0]?.message?.content || '';

    if (!generatedText) {
      throw new Error('AI API returned empty response');
    }

    logger.debug('AI Response length:', generatedText.length);

    return generatedText.trim();
  }

  /**
   * Execute a specific recommendation action
   */
  async executeRecommendation(
    analysisId: number,
    userId: number,
    actionIndex: number,
    sql: string
  ) {
    // Get the analysis
    const analysis = await prisma.dbAnalysisResult.findUnique({
      where: { id: analysisId },
    });

    if (!analysis) {
      throw new Error('Analysis not found');
    }

    // Update executed actions
    const currentActions = (analysis.actionsTaken as any[]) || [];
    currentActions.push({
      actionIndex,
      sql,
      executedBy: userId,
      executedAt: new Date(),
      status: 'pending',
    });

    await tableAnalysisService.updateExecutedActions(analysisId, currentActions);

    return {
      success: true,
      message: 'Action recorded. Please execute SQL manually in Query Editor.',
      sql,
    };
  }

  /**
   * Get analysis by ID
   */
  async getAnalysisById(id: number) {
    const analysis = await prisma.dbAnalysisResult.findUnique({
      where: { id },
      include: {
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!analysis) {
      throw new Error('Analysis not found');
    }

    return {
      id: analysis.id,
      scenario: analysis.scenarioDetected,
      healthScore: analysis.healthScore,
      analysis: analysis.aiAnalysis,
      recommendations: analysis.recommendations,
      context: analysis.tableContext,
      executedActions: analysis.actionsTaken,
      executor: analysis.executor,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
    };
  }
}

export default new AIAnalysisService();

