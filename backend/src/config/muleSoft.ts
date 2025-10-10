import config from './env';
import { getSetting } from '../utils/getSettings';

export interface MuleSoftConfig {
  baseUrl: string;
  username: string;
  password: string;
  timeout: number;
  endpoints: {
    processDocument: string;
    analyzeData: string;
  };
}

/**
 * Get MuleSoft configuration from database settings (with fallback to env vars)
 */
export async function getMuleSoftConfig(): Promise<MuleSoftConfig> {
  const baseUrl = await getSetting('mulesoft_api_base_url', config.mulesoftApiBaseUrl);
  const username = await getSetting('mulesoft_api_username', config.mulesoftApiUsername);
  const password = await getSetting('mulesoft_api_password', config.mulesoftApiPassword);
  const timeoutStr = await getSetting('mulesoft_api_timeout', config.mulesoftApiTimeout.toString());

  return {
    baseUrl: baseUrl || config.mulesoftApiBaseUrl,
    username: username || config.mulesoftApiUsername,
    password: password || config.mulesoftApiPassword,
    timeout: parseInt(timeoutStr || config.mulesoftApiTimeout.toString(), 10),
    endpoints: {
      processDocument: '/process/document',
      analyzeData: '/analyze',
    },
  };
}

// Legacy export for backward compatibility (reads from env)
const muleSoftConfig: MuleSoftConfig = {
  baseUrl: config.mulesoftApiBaseUrl,
  username: config.mulesoftApiUsername,
  password: config.mulesoftApiPassword,
  timeout: config.mulesoftApiTimeout,
  endpoints: {
    processDocument: '/process/document',
    analyzeData: '/analyze',
  },
};

export default muleSoftConfig;

