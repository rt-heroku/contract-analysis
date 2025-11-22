import { Response } from 'express';
import systemPromptService from '../services/systemPrompt.service';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';
import loggingService from '../services/logging.service';

/**
 * Get all system prompts (admin only)
 */
export const getAllSystemPrompts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prompts = await systemPromptService.getAllSystemPrompts();
    
    await loggingService.logActivity({
      userId: req.user!.id,
      actionType: 'system_prompt.list',
      actionDescription: 'Viewed all system prompts',
    });
    
    res.json(prompts);
  } catch (error: any) {
    logger.error('Get all system prompts error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch system prompts' });
  }
};

/**
 * Get system prompt by ID
 */
export const getSystemPromptById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const prompt = await systemPromptService.getSystemPromptById(id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'System prompt not found' });
    }
    
    res.json(prompt);
  } catch (error: any) {
    logger.error('Get system prompt by ID error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch system prompt' });
  }
};

/**
 * Get prompt versions for a feature type
 */
export const getPromptVersions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { featureType } = req.params;
    const versions = await systemPromptService.getPromptVersions(featureType);
    
    res.json(versions);
  } catch (error: any) {
    logger.error('Get prompt versions error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch prompt versions' });
  }
};

/**
 * Create system prompt
 */
export const createSystemPrompt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = {
      ...req.body,
      createdBy: req.user!.id,
    };
    
    const prompt = await systemPromptService.createSystemPrompt(data);
    
    await loggingService.logActivity({
      userId: req.user!.id,
      actionType: 'system_prompt.create',
      actionDescription: `Created system prompt: ${prompt.name} (${prompt.featureType})`,
      metadata: { promptId: prompt.id, featureType: prompt.featureType },
    });
    
    res.status(201).json(prompt);
  } catch (error: any) {
    logger.error('Create system prompt error:', error);
    res.status(500).json({ error: error.message || 'Failed to create system prompt' });
  }
};

/**
 * Update system prompt
 */
export const updateSystemPrompt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = {
      ...req.body,
      updatedBy: req.user!.id,
    };
    
    const prompt = await systemPromptService.updateSystemPrompt(id, data);
    
    await loggingService.logActivity({
      userId: req.user!.id,
      actionType: 'system_prompt.update',
      actionDescription: `Updated system prompt: ${prompt.name} (${prompt.featureType})`,
      metadata: { promptId: prompt.id, featureType: prompt.featureType },
    });
    
    res.json(prompt);
  } catch (error: any) {
    logger.error('Update system prompt error:', error);
    res.status(500).json({ error: error.message || 'Failed to update system prompt' });
  }
};

/**
 * Delete system prompt
 */
export const deleteSystemPrompt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const prompt = await systemPromptService.getSystemPromptById(id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'System prompt not found' });
    }
    
    await systemPromptService.deleteSystemPrompt(id);
    
    await loggingService.logActivity({
      userId: req.user!.id,
      actionType: 'system_prompt.delete',
      actionDescription: `Deleted system prompt: ${prompt.name} (${prompt.featureType})`,
      metadata: { promptId: id, featureType: prompt.featureType },
    });
    
    res.json({ message: 'System prompt deleted successfully' });
  } catch (error: any) {
    logger.error('Delete system prompt error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete system prompt' });
  }
};

/**
 * Toggle system prompt active status
 */
export const toggleActive = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;
    
    const prompt = await systemPromptService.toggleActive(id, isActive, req.user!.id);
    
    await loggingService.logActivity({
      userId: req.user!.id,
      actionType: 'system_prompt.toggle',
      actionDescription: `${isActive ? 'Activated' : 'Deactivated'} system prompt: ${prompt.name}`,
      metadata: { promptId: id, isActive },
    });
    
    res.json(prompt);
  } catch (error: any) {
    logger.error('Toggle system prompt error:', error);
    res.status(500).json({ error: error.message || 'Failed to toggle system prompt' });
  }
};

/**
 * Test render a prompt with sample variables
 */
export const testRenderPrompt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { variables } = req.body;
    
    const prompt = await systemPromptService.getSystemPromptById(id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'System prompt not found' });
    }
    
    const rendered = systemPromptService.renderPrompt(prompt.promptTemplate, variables);
    
    res.json({ rendered });
  } catch (error: any) {
    logger.error('Test render prompt error:', error);
    res.status(500).json({ error: error.message || 'Failed to render prompt' });
  }
};

