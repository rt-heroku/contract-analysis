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
 * Get MuleSoft configuration with proper priority order:
 * 1. Property file (not implemented yet - skip)
 * 2. Database (system_settings table)
 * 3. Environment variables (overrides DB if present)
 */
export async function getMuleSoftConfig(): Promise<MuleSoftConfig> {
  // Get from database first
  const dbBaseUrl = await getSetting('mulesoft_api_base_url', null);
  const dbUsername = await getSetting('mulesoft_api_username', null);
  const dbPassword = await getSetting('mulesoft_api_password', null);
  const dbTimeoutStr = await getSetting('mulesoft_api_timeout', null);

  // Environment variables override database values
  const baseUrl = process.env.MULESOFT_API_BASE_URL || dbBaseUrl || config.mulesoftApiBaseUrl;
  const username = process.env.MULESOFT_API_USERNAME || dbUsername || config.mulesoftApiUsername;
  const password = process.env.MULESOFT_API_PASSWORD || dbPassword || config.mulesoftApiPassword;
  const timeout = process.env.MULESOFT_API_TIMEOUT 
    ? parseInt(process.env.MULESOFT_API_TIMEOUT, 10)
    : (dbTimeoutStr ? parseInt(dbTimeoutStr, 10) : config.mulesoftApiTimeout);

  return {
    baseUrl,
    username,
    password,
    timeout,
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

