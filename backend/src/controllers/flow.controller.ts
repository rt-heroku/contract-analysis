import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import flowService from '../services/flow.service';

class FlowController {
  /**
   * Get all available flows from MuleSoft
   */
  async getFlows(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const flows = await flowService.getFlows();
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
      const flow = await flowService.getFlowByName(name);
      
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

