import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';

class FlowEditorController {
  // Get all flows
  async getFlows(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const flows = await prisma.flow.findMany({
        where: { isActive: true },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      res.json({ flows });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get flow by ID
  async getFlowById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { id } = req.params;

      const flow = await prisma.flow.findUnique({
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
        },
      });

      if (!flow) {
        res.status(404).json({ error: 'Flow not found' });
        return;
      }

      res.json({ flow });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create flow
  async createFlow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { name, description, flowData, category } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Flow name is required' });
        return;
      }

      const flow = await prisma.flow.create({
        data: {
          name,
          description,
          flowData: flowData || JSON.stringify({ nodes: [], edges: [] }),
          category,
          createdBy: req.user.id,
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
        },
      });

      res.status(201).json({ flow });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update flow
  async updateFlow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { id } = req.params;
      const { name, description, flowData, category, isActive } = req.body;

      const existingFlow = await prisma.flow.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingFlow) {
        res.status(404).json({ error: 'Flow not found' });
        return;
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (flowData !== undefined) updateData.flowData = flowData;
      if (category !== undefined) updateData.category = category;
      if (isActive !== undefined) updateData.isActive = isActive;

      const flow = await prisma.flow.update({
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
        },
      });

      res.json({ flow });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete flow (soft delete)
  async deleteFlow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { id } = req.params;

      const flow = await prisma.flow.findUnique({
        where: { id: parseInt(id) },
      });

      if (!flow) {
        res.status(404).json({ error: 'Flow not found' });
        return;
      }

      await prisma.flow.update({
        where: { id: parseInt(id) },
        data: { isActive: false },
      });

      res.json({ message: 'Flow deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new FlowEditorController();

