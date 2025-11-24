import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SystemPromptData {
  name: string;
  featureType: string;
  description?: string;
  promptTemplate: string;
  variables?: any;
  processingConfig?: any;
  isActive?: boolean;
  version?: number;
  metadata?: any;
  createdBy?: number;
  updatedBy?: number;
}

class SystemPromptService {
  /**
   * Get all system prompts (admin only)
   */
  async getAllSystemPrompts() {
    return prisma.systemPrompt.findMany({
      orderBy: [
        { featureType: 'asc' },
        { version: 'desc' },
      ],
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get active system prompt by feature type
   */
  async getActivePromptByFeature(featureType: string) {
    return prisma.systemPrompt.findFirst({
      where: {
        featureType,
        isActive: true,
      },
      orderBy: {
        version: 'desc',
      },
    });
  }

  /**
   * Get system prompt by ID
   */
  async getSystemPromptById(id: number) {
    return prisma.systemPrompt.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get all versions of a feature type
   */
  async getPromptVersions(featureType: string) {
    return prisma.systemPrompt.findMany({
      where: { featureType },
      orderBy: { version: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Create new system prompt
   */
  async createSystemPrompt(data: SystemPromptData) {
    // Check if feature type + version already exists
    if (data.version) {
      const existing = await prisma.systemPrompt.findUnique({
        where: {
          featureType_version: {
            featureType: data.featureType,
            version: data.version,
          },
        },
      });

      if (existing) {
        throw new Error(`System prompt with feature type "${data.featureType}" version ${data.version} already exists`);
      }
    } else {
      // Auto-increment version
      const latest = await prisma.systemPrompt.findFirst({
        where: { featureType: data.featureType },
        orderBy: { version: 'desc' },
      });
      data.version = latest ? latest.version + 1 : 1;
    }

    return prisma.systemPrompt.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update system prompt
   */
  async updateSystemPrompt(id: number, data: Partial<SystemPromptData>) {
    const existing = await this.getSystemPromptById(id);
    if (!existing) {
      throw new Error(`System prompt with ID ${id} not found`);
    }

    // If changing version, check uniqueness
    if (data.version && data.version !== existing.version) {
      const versionExists = await prisma.systemPrompt.findUnique({
        where: {
          featureType_version: {
            featureType: existing.featureType,
            version: data.version,
          },
        },
      });

      if (versionExists) {
        throw new Error(`Version ${data.version} already exists for feature type "${existing.featureType}"`);
      }
    }

    return prisma.systemPrompt.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete system prompt
   */
  async deleteSystemPrompt(id: number) {
    return prisma.systemPrompt.delete({
      where: { id },
    });
  }

  /**
   * Activate/deactivate system prompt
   */
  async toggleActive(id: number, isActive: boolean, updatedBy?: number) {
    return prisma.systemPrompt.update({
      where: { id },
      data: {
        isActive,
        updatedBy,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Render prompt template with variables
   */
  renderPrompt(template: string, variables: Record<string, any>): string {
    let rendered = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      rendered = rendered.replace(new RegExp(placeholder, 'g'), valueStr);
    }
    
    return rendered;
  }

  /**
   * Get prompt for Query AI feature with schema context
   */
  async getQueryAIPrompt(schemaContext: string, userQuery: string) {
    const prompt = await this.getActivePromptByFeature('query_ai');
    
    if (!prompt) {
      throw new Error('Query AI system prompt not configured');
    }

    return this.renderPrompt(prompt.promptTemplate, {
      schema_context: schemaContext,
      user_query: userQuery,
    });
  }

  /**
   * Get prompt for Performance Analysis feature
   */
  async getPerformanceAnalysisPrompt(
    performanceMetrics: any,
    tableStats: any,
    indexUsage: any,
    slowQueries: any
  ) {
    const prompt = await this.getActivePromptByFeature('performance_analysis');
    
    if (!prompt) {
      throw new Error('Performance Analysis system prompt not configured');
    }

    return this.renderPrompt(prompt.promptTemplate, {
      performance_metrics: performanceMetrics,
      table_stats: tableStats,
      index_usage: indexUsage,
      slow_queries: slowQueries,
    });
  }
}

export default new SystemPromptService();

