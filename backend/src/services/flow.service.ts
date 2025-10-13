import axios from 'axios';
import logger from '../utils/logger';
import { getSetting } from '../utils/getSettings';

interface FlowVariable {
  name: string;
  type: string;
}

interface Flow {
  name: string;
  description: string;
  url: string;
  method: string;
  vars: FlowVariable[];
}

interface FlowsResponse {
  flows: Flow[];
}

class FlowService {
  /**
   * Get list of available flows from MuleSoft API
   */
  async getFlows(): Promise<Flow[]> {
    try {
      // Priority: ENV var > Database > config default
      const dbUrl = await getSetting('mulesoft_api_base_url', null);
      const mulesoftUrl = process.env.MULESOFT_API_BASE_URL || dbUrl;
      
      if (!mulesoftUrl) {
        throw new Error('MuleSoft API URL not configured');
      }

      const flowsEndpoint = `${mulesoftUrl}/flows`;
      
      logger.info(`Fetching flows from MuleSoft: ${flowsEndpoint}`);

      const response = await axios.get<FlowsResponse>(flowsEndpoint, {
        timeout: 30000, // 30 seconds timeout
      });

      logger.info(`Fetched ${response.data.flows.length} flows from MuleSoft`);

      return response.data.flows;
    } catch (error: any) {
      logger.error('Error fetching flows from MuleSoft', {
        error: error.message,
        stack: error.stack,
      });
      
      // Return empty array instead of throwing to prevent blocking the UI
      return [];
    }
  }

  /**
   * Get a specific flow by name
   */
  async getFlowByName(flowName: string): Promise<Flow | null> {
    try {
      const flows = await this.getFlows();
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

