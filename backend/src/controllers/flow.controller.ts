import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import flowService from '../services/flow.service';

class FlowController {
  /**
   * Get all available flows from database (filtered by user access)
   */
  async getFlows(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const flows = await flowService.getFlows(userId);
      res.json({ flows });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get a specific flow by name
   */
  async getFlowByName(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const userId = req.user?.id;
      const flow = await flowService.getFlowByName(name, userId);
      
      if (!flow) {
        res.status(404).json({ error: 'Flow not found' });
        return;
      }

      res.json({ flow });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new FlowController();

