import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';

/**
 * Extract variables from markdown content
 * Variables are in format: {{variable_name}}
 */
function extractVariables(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const variable = match[1].trim();
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }

  return variables;
}

class PromptController {
  /**
   * Get all prompts (with optional search)
   */
  async getAllPrompts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search, category, active } = req.query;

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (category) {
        where.category = category as string;
      }

      if (active !== undefined) {
        where.isActive = active === 'true';
      }

      const prompts = await prisma.prompt.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          variables: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      res.json({ prompts });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get a single prompt by ID
   */
  async getPromptById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const prompt = await prisma.prompt.findUnique({
        where: { id: parseInt(id) },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          variables: true,
        },
      });

      if (!prompt) {
        res.status(404).json({ error: 'Prompt not found' });
        return;
      }

      res.json({ prompt });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Create a new prompt
   */
  async createPrompt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { name, description, content, category, variables } = req.body;

      if (!name || !content) {
        res.status(400).json({ error: 'Name and content are required' });
        return;
      }

      // Extract variables from content if not provided
      const extractedVars = extractVariables(content);

      // Create prompt with variables
      const prompt = await prisma.prompt.create({
        data: {
          name,
          description,
          content,
          category,
          createdBy: req.user.id,
          variables: {
            create: variables || extractedVars.map((varName: string) => ({
              variableName: varName,
              displayName: varName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              isRequired: true,
              variableType: 'text',
            })),
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          variables: true,
        },
      });

      res.status(201).json({ prompt });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update a prompt
   */
  async updatePrompt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { id } = req.params;
      const { name, description, content, category, isActive, variables } = req.body;

      // Check if prompt exists
      const existingPrompt = await prisma.prompt.findUnique({
        where: { id: parseInt(id) },
        include: { variables: true },
      });

      if (!existingPrompt) {
        res.status(404).json({ error: 'Prompt not found' });
        return;
      }

      // Update prompt
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (content !== undefined) updateData.content = content;
      if (category !== undefined) updateData.category = category;
      if (isActive !== undefined) updateData.isActive = isActive;

      // If content changed, update variables
      if (content !== undefined && variables) {
        // Delete old variables
        await prisma.promptVariable.deleteMany({
          where: { promptId: parseInt(id) },
        });

        // Create new variables
        updateData.variables = {
          create: variables,
        };
      }

      const prompt = await prisma.prompt.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          variables: true,
        },
      });

      res.json({ prompt });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Delete a prompt
   */
  async deletePrompt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const prompt = await prisma.prompt.findUnique({
        where: { id: parseInt(id) },
      });

      if (!prompt) {
        res.status(404).json({ error: 'Prompt not found' });
        return;
      }

      await prisma.prompt.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: 'Prompt deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get categories
   */
  async getCategories(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const categories = await prisma.prompt.findMany({
        where: {
          category: { not: null },
        },
        select: { category: true },
        distinct: ['category'],
      });

      const categoryList = categories
        .map((c) => c.category)
        .filter((c) => c !== null) as string[];

      res.json({ categories: categoryList });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Execute a prompt with variable values
   */
  async executePrompt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { variables, jobId } = req.body;

      // Get prompt with variables
      const prompt = await prisma.prompt.findUnique({
        where: { id: parseInt(id) },
        include: { variables: true },
      });

      if (!prompt) {
        res.status(404).json({ error: 'Prompt not found' });
        return;
      }

      // Validate required variables
      for (const variable of prompt.variables) {
        if (variable.isRequired && !variables[variable.variableName]) {
          res.status(400).json({
            error: `Required variable missing: ${variable.displayName}`,
          });
          return;
        }
      }

      // Replace variables in content
      let processedContent = prompt.content;
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        processedContent = processedContent.replace(regex, value as string);
      }

      res.json({
        processedContent,
        prompt: {
          id: prompt.id,
          name: prompt.name,
        },
        jobId,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new PromptController();

