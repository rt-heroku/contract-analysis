import prisma from '../config/database';
import logger from '../utils/logger';
import { ActivityLogData, ApiLogData, NotificationData } from '../types';

class LoggingService {
  /**
   * Log user activity
   */
  async logActivity(data: ActivityLogData): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          userId: data.userId,
          jobId: data.jobId,
          actionType: data.actionType,
          actionDescription: data.actionDescription,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata || {},
          status: data.status || 'success',
        },
      });
    } catch (error) {
      logger.error('Failed to log activity:', error);
    }
  }

  /**
   * Log API call
   */
  async logApiCall(data: ApiLogData): Promise<void> {
    try {
      await prisma.apiLog.create({
        data: {
          userId: data.userId,
          jobId: data.jobId,
          requestMethod: data.requestMethod,
          requestUrl: data.requestUrl,
          requestHeaders: data.requestHeaders || {},
          requestBody: data.requestBody || {},
          responseStatus: data.responseStatus,
          responseBody: data.responseBody || {},
          responseTimeMs: data.responseTimeMs,
          errorMessage: data.errorMessage,
          relatedRecordType: data.relatedRecordType,
          relatedRecordId: data.relatedRecordId,
        },
      });
    } catch (error) {
      logger.error('Failed to log API call:', error);
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(
    userId: number,
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where: { userId } }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all activity logs (admin)
   */
  async getAllActivityLogs(
    filters: {
      userId?: number;
      actionType?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.actionType) where.actionType = filters.actionType;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get API logs (admin)
   */
  async getApiLogs(
    filters: {
      userId?: number;
      startDate?: Date;
      endDate?: Date;
      status?: number;
    },
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.responseStatus = filters.status;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.apiLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.apiLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new LoggingService();

