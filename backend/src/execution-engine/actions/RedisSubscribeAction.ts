import Redis from 'ioredis';
import logger from '../../utils/logger';

export interface RedisSubscribeActionConfig {
  connectorId: number;
  channel: string;
  timeoutMs?: number; // Optional timeout to wait for a single message
  parseJson?: boolean; // Auto-parse JSON messages
}

export class RedisSubscribeAction {
  redisClients: Map<number, Redis> = new Map();

  async execute(config: RedisSubscribeActionConfig): Promise<any> {
    try {
      const { connectorId, channel, timeoutMs = 5000, parseJson = true } = config;

      // Get or create Redis client for this connector
      const redisClient = await this.getRedisClient(connectorId);

      // Create a promise that resolves when we receive a message or timeout
      const messagePromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          redisClient.unsubscribe(channel);
          reject(new Error(`Subscription timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        redisClient.on('message', (receivedChannel: string, message: string) => {
          if (receivedChannel === channel) {
            clearTimeout(timeoutId);
            redisClient.unsubscribe(channel);

            let parsedMessage = message;
            if (parseJson) {
              try {
                parsedMessage = JSON.parse(message);
              } catch {
                // If parsing fails, keep as string
                logger.warn(`Could not parse message as JSON from channel "${channel}"`);
              }
            }

            resolve({
              success: true,
              channel,
              message: parsedMessage,
              timestamp: new Date().toISOString(),
            });
          }
        });

        redisClient.on('error', (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        });

        // Subscribe to the channel
        redisClient.subscribe(channel, (err) => {
          if (err) {
            clearTimeout(timeoutId);
            reject(err);
          } else {
            logger.info(`Subscribed to Redis channel "${channel}"`);
          }
        });
      });

      return await messagePromise;
    } catch (error: any) {
      logger.error('Error in RedisSubscribeAction:', error);
      throw new Error(`Redis subscribe failed: ${error.message}`);
    }
  }

  async getRedisClient(connectorId: number): Promise<Redis> {
    // Create a NEW client for each subscription to avoid conflicts
    // (Redis doesn't allow regular commands on a subscribed connection)
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
    if (!redisUrl) {
      throw new Error('Redis connector not configured');
    }

    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
    });

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

export default RedisSubscribeAction;

