import config from './env';

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

