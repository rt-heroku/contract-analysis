import prisma from '../config/database';
import logger from '../utils/logger';

interface FlowVariable {
  name: string;
  type: string;
  mandatory?: boolean;
}

interface Flow {
  id: number;
  name: string;
  description: string | null;
  url: string;
  method: string;
  vars: FlowVariable[] | null;
  mulesoftApiId: number;
  apiName: string;
}

class FlowService {
  /**
   * Get list of available flows from database
   * Returns flows from MuleSoft APIs that the user has access to
   */
  async getFlows(userId?: number): Promise<Flow[]> {
    try {
      // If no userId provided, return all active flows
      if (!userId) {
        const flows = await prisma.mulesoftFlow.findMany({
          where: { isActive: true },
          include: {
            mulesoftApi: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return flows
          .filter(f => f.mulesoftApi.isActive)
          .map(f => ({
            id: f.id,
            name: f.name,
            description: f.description,
            url: f.url,
            method: f.method,
            vars: f.vars as any,
            mulesoftApiId: f.mulesoftApiId,
            apiName: f.mulesoftApi.name,
          }));
      }

      // Get all APIs the user has access to
      const apis = await prisma.mulesoftApi.findMany({
        where: {
          isActive: true,
          OR: [
            { createdBy: userId },
            {
              sharedWith: {
                array_contains: userId,
              },
            },
          ],
        },
      });

      // Get flows from these APIs
      const apiIds = apis.map(api => api.id);
      const flows = await prisma.mulesoftFlow.findMany({
        where: {
          mulesoftApiId: { in: apiIds },
          isActive: true,
        },
        include: {
          mulesoftApi: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      logger.info(`Fetched ${flows.length} flows from database for user ${userId}`);

      return flows.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        url: f.url,
        method: f.method,
        vars: f.vars as any,
        mulesoftApiId: f.mulesoftApiId,
        apiName: f.mulesoftApi.name,
      }));
    } catch (error: any) {
      logger.error('Error fetching flows from database', {
        error: error.message,
        stack: error.stack,
      });
      
      // Return empty array instead of throwing to prevent blocking the UI
      return [];
    }
  }

  /**
   * Get a specific flow by ID
   */
  async getFlowById(flowId: number, userId?: number): Promise<Flow | null> {
    try {
      const flow = await prisma.mulesoftFlow.findUnique({
        where: { id: flowId },
        include: {
          mulesoftApi: {
            select: {
              id: true,
              name: true,
              isActive: true,
              createdBy: true,
              sharedWith: true,
            },
          },
        },
      });

      if (!flow || !flow.mulesoftApi.isActive) {
        return null;
      }

      // Check access if userId provided
      if (userId) {
        const sharedWith = Array.isArray(flow.mulesoftApi.sharedWith)
          ? flow.mulesoftApi.sharedWith
          : Object.values(flow.mulesoftApi.sharedWith || {}).filter((v: any) => typeof v === 'number');
        
        const hasAccess = flow.mulesoftApi.createdBy === userId || sharedWith.includes(userId);
        
        if (!hasAccess) {
          return null;
        }
      }

      return {
        id: flow.id,
        name: flow.name,
        description: flow.description,
        url: flow.url,
        method: flow.method,
        vars: flow.vars as any,
        mulesoftApiId: flow.mulesoftApiId,
        apiName: flow.mulesoftApi.name,
      };
    } catch (error: any) {
      logger.error('Error getting flow by ID', {
        flowId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get a specific flow by name (deprecated - use getFlowById instead)
   */
  async getFlowByName(flowName: string, userId?: number): Promise<Flow | null> {
    try {
      const flows = await this.getFlows(userId);
      return flows.find(f => f.name === flowName) || null;
    } catch (error: any) {
      logger.error('Error getting flow by name', {
        flowName,
        error: error.message,
      });
      return null;
    }
  }
}

export default new FlowService();

