import prisma from '../../config/database';
import logger from '../../utils/logger';

export interface LogActionConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: any;
}

export interface LogActionContext {
  userId?: number;
  processId?: number;
  actionId?: number;
  jobId?: string;
}

export class LogAction {
  async execute(config: LogActionConfig, context: LogActionContext): Promise<any> {
    try {
      const { level, message, metadata } = config;
      const { userId, processId, actionId, jobId } = context;

      // Log to console using Winston logger
      switch (level) {
        case 'debug':
          logger.debug(message, metadata);
          break;
        case 'info':
          logger.info(message, metadata);
          break;
        case 'warn':
          logger.warn(message, metadata);
          break;
        case 'error':
          logger.error(message, metadata);
          break;
        default:
          logger.info(message, metadata);
      }

      // Store in activity_logs table
      const activityLog = await prisma.activityLog.create({
        data: {
          userId: userId || null,
          jobId: jobId || null,
          processId: processId || null,
          actionId: actionId || null,
          logLevel: level,
          actionType: 'log',
          actionDescription: message,
          metadata: metadata || null,
          status: 'success',
        },
      });

      return {
        success: true,
        logId: activityLog.id,
        timestamp: activityLog.createdAt,
        level,
        message,
      };
    } catch (error: any) {
      logger.error('Error in LogAction:', error);
      throw new Error(`Log action failed: ${error.message}`);
    }
  }
}

export default LogAction;

