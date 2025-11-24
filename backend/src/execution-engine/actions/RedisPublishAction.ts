import Redis from 'ioredis';
import logger from '../../utils/logger';

export interface RedisPublishActionConfig {
  connectorId: number;
  channel: string;
  message: any; // Will be JSON stringified if not string
}

export class RedisPublishAction {
  redisClients: Map<number, Redis> = new Map();

  async execute(config: RedisPublishActionConfig): Promise<any> {
    try {
      const { connectorId, channel, message } = config;

      // Get or create Redis client for this connector
      const redisClient = await this.getRedisClient(connectorId);

      // Serialize message if it's an object
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);

      // Publish to Redis channel
      const subscribersCount = await redisClient.publish(channel, messageString);

      logger.info(`Published message to Redis channel "${channel}" - ${subscribersCount} subscribers`);

      return {
        success: true,
        channel,
        subscribersCount,
        message: messageString,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Error in RedisPublishAction:', error);
      throw new Error(`Redis publish failed: ${error.message}`);
    }
  }

  async getRedisClient(connectorId: number): Promise<Redis> {
    // Check if we already have a client for this connector
    if (this.redisClients.has(connectorId)) {
      return this.redisClients.get(connectorId)!;
    }

    // Create new Redis client
    // In a real implementation, we would fetch the connector config from the database
    // For now, use the environment variable as fallback
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
    if (!redisUrl) {
      throw new Error('Redis connector not configured');
    }

    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
    });

    this.redisClients.set(connectorId, client);
    return client;
  }

  async cleanup(): Promise<void> {
    // Disconnect all Redis clients
    for (const [connectorId, client] of this.redisClients.entries()) {
      await client.quit();
      logger.info(`Disconnected Redis client for connector ${connectorId}`);
    }
    this.redisClients.clear();
  }
}

export default RedisPublishAction;

