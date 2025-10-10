"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const types_1 = require("../types");
class LoggingService {
    /**
     * Log user activity
     */
    async logActivity(data) {
        try {
            await database_1.default.activityLog.create({
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
        }
        catch (error) {
            logger_1.default.error('Failed to log activity:', error);
        }
    }
    /**
     * Log API call
     */
    async logApiCall(data) {
        try {
            await database_1.default.apiLog.create({
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
        }
        catch (error) {
            logger_1.default.error('Failed to log API call:', error);
        }
    }
    /**
     * Get user activity logs
     */
    async getUserActivityLogs(userId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            database_1.default.activityLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            database_1.default.activityLog.count({ where: { userId } }),
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
    async getAllActivityLogs(filters, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.userId)
            where.userId = filters.userId;
        if (filters.actionType)
            where.actionType = filters.actionType;
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate)
                where.createdAt.gte = filters.startDate;
            if (filters.endDate)
                where.createdAt.lte = filters.endDate;
        }
        const [logs, total] = await Promise.all([
            database_1.default.activityLog.findMany({
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
            database_1.default.activityLog.count({ where }),
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
    async getApiLogs(filters, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.userId)
            where.userId = filters.userId;
        if (filters.status)
            where.responseStatus = filters.status;
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate)
                where.createdAt.gte = filters.startDate;
            if (filters.endDate)
                where.createdAt.lte = filters.endDate;
        }
        const [logs, total] = await Promise.all([
            database_1.default.apiLog.findMany({
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
            database_1.default.apiLog.count({ where }),
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
exports.default = new LoggingService();
//# sourceMappingURL=logging.service.js.map