import prisma from '../config/database';
import logger from '../utils/logger';

export interface CreateProcessInput {
  name: string;
  description?: string;
  category?: string;
  flowDefinition: any; // ReactFlow nodes and edges
  executionMode?: 'sequential' | 'parallel' | 'hybrid';
  timeoutSeconds?: number;
  retryPolicy?: any;
  isTemplate?: boolean;
  createdBy: number;
  sharedWith?: number[];
}

export interface UpdateProcessInput {
  name?: string;
  description?: string;
  category?: string;
  flowDefinition?: any;
  executionMode?: 'sequential' | 'parallel' | 'hybrid';
  timeoutSeconds?: number;
  retryPolicy?: any;
  isActive?: boolean;
  isTemplate?: boolean;
  sharedWith?: number[];
}

class ProcessService {
  /**
   * Get all processes accessible by user
   */
  async getProcesses(userId: number, filters?: {
    category?: string;
    isActive?: boolean;
    isTemplate?: boolean;
  }) {
    try {
      const where: any = {
        createdBy: userId,
      };

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.isTemplate !== undefined) {
        where.isTemplate = filters.isTemplate;
      }

      const processes = await prisma.process.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              processExecutions: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      });

      return processes;
    } catch (error: any) {
      logger.error('Error fetching processes:', error);
      throw new Error(`Failed to fetch processes: ${error.message}`);
    }
  }

  /**
   * Get process by ID
   */
  async getProcessById(processId: number, userId: number) {
    try {
      const process = await prisma.process.findFirst({
        where: {
          id: processId,
          createdBy: userId,
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
          _count: {
            select: {
              processExecutions: true,
            },
          },
        },
      });

      if (!process) {
        throw new Error('Process not found or access denied');
      }

      return process;
    } catch (error: any) {
      logger.error(`Error fetching process ${processId}:`, error);
      throw error;
    }
  }

  /**
   * Create new process
   */
  async createProcess(data: CreateProcessInput) {
    try {
      const process = await prisma.process.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          flowDefinition: data.flowDefinition,
          executionMode: data.executionMode || 'sequential',
          timeoutSeconds: data.timeoutSeconds,
          retryPolicy: data.retryPolicy,
          isTemplate: data.isTemplate || false,
          createdBy: data.createdBy,
          sharedWith: data.sharedWith || [],
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
        },
      });

      logger.info(`Process created: ${process.name} by user ${data.createdBy}`);
      return process;
    } catch (error: any) {
      logger.error('Error creating process:', error);
      throw new Error(`Failed to create process: ${error.message}`);
    }
  }

  /**
   * Update process
   */
  async updateProcess(processId: number, userId: number, data: UpdateProcessInput) {
    try {
      const existing = await prisma.process.findFirst({
        where: { id: processId, createdBy: userId },
      });

      if (!existing) {
        throw new Error('Process not found or you do not have permission to update it');
      }

      const process = await prisma.process.update({
        where: { id: processId },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          flowDefinition: data.flowDefinition,
          executionMode: data.executionMode,
          timeoutSeconds: data.timeoutSeconds,
          retryPolicy: data.retryPolicy,
          isActive: data.isActive,
          isTemplate: data.isTemplate,
          sharedWith: data.sharedWith,
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
        },
      });

      logger.info(`Process updated: ${process.name} by user ${userId}`);
      return process;
    } catch (error: any) {
      logger.error(`Error updating process ${processId}:`, error);
      throw error;
    }
  }

  /**
   * Delete process
   */
  async deleteProcess(processId: number, userId: number) {
    try {
      const existing = await prisma.process.findFirst({
        where: { id: processId, createdBy: userId },
      });

      if (!existing) {
        throw new Error('Process not found or you do not have permission to delete it');
      }

      await prisma.process.delete({
        where: { id: processId },
      });

      logger.info(`Process deleted: ${existing.name} by user ${userId}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`Error deleting process ${processId}:`, error);
      throw error;
    }
  }

  /**
   * Share process with users
   */
  async shareProcess(processId: number, userId: number, shareWithUserIds: number[]) {
    try {
      const existing = await prisma.process.findFirst({
        where: { id: processId, createdBy: userId },
      });

      if (!existing) {
        throw new Error('Process not found or you do not have permission to share it');
      }

      const currentShared = Array.isArray(existing.sharedWith) ? existing.sharedWith as number[] : [];
      const newShared = [...new Set([...currentShared, ...shareWithUserIds])];

      const process = await prisma.process.update({
        where: { id: processId },
        data: { sharedWith: newShared as any },
      });

      logger.info(`Process ${process.name} shared with ${shareWithUserIds.length} users by user ${userId}`);
      return process;
    } catch (error: any) {
      logger.error(`Error sharing process ${processId}:`, error);
      throw error;
    }
  }

  /**
   * Export process as JSON
   */
  async exportProcess(processId: number, userId: number) {
    try {
      const process = await this.getProcessById(processId, userId);

      const exportData = {
        version: '1.0.0',
        metadata: {
          name: process.name,
          description: process.description || '',
          category: process.category || '',
          author: `${process.creator.firstName || ''} ${process.creator.lastName || ''}`.trim() || process.creator.email,
          createdAt: process.createdAt,
        },
        flowDefinition: process.flowDefinition,
        executionConfig: {
          mode: process.executionMode as 'sequential' | 'parallel' | 'hybrid',
          timeout: process.timeoutSeconds || undefined,
          retryPolicy: process.retryPolicy || undefined,
        },
      };

      return exportData;
    } catch (error: any) {
      logger.error(`Error exporting process ${processId}:`, error);
      throw error;
    }
  }

  /**
   * Import process from JSON
   */
  async importProcess(userId: number, importData: any) {
    try {
      // Validate import data structure
      if (!importData.metadata?.name || !importData.flowDefinition) {
        throw new Error('Invalid import data format');
      }

      const process = await this.createProcess({
        name: importData.metadata.name,
        description: importData.metadata.description || undefined,
        category: importData.metadata.category || undefined,
        flowDefinition: importData.flowDefinition,
        executionMode: (importData.executionConfig?.mode || 'sequential') as 'sequential' | 'parallel' | 'hybrid',
        timeoutSeconds: importData.executionConfig?.timeout || undefined,
        retryPolicy: importData.executionConfig?.retryPolicy || undefined,
        createdBy: userId,
      });

      logger.info(`Process imported: ${process.name} by user ${userId}`);
      return process;
    } catch (error: any) {
      logger.error('Error importing process:', error);
      throw error;
    }
  }

  /**
   * Clone process
   */
  async cloneProcess(processId: number, userId: number, newName: string) {
    try {
      const original = await this.getProcessById(processId, userId);

      const process = await this.createProcess({
        name: newName || `${original.name} (Copy)`,
        description: original.description || undefined,
        category: original.category || undefined,
        flowDefinition: original.flowDefinition,
        executionMode: original.executionMode as 'sequential' | 'parallel' | 'hybrid',
        timeoutSeconds: original.timeoutSeconds || undefined,
        retryPolicy: original.retryPolicy || undefined,
        createdBy: userId,
      });

      logger.info(`Process cloned: ${original.name} -> ${process.name} by user ${userId}`);
      return process;
    } catch (error: any) {
      logger.error(`Error cloning process ${processId}:`, error);
      throw error;
    }
  }
}

export const processService = new ProcessService();

