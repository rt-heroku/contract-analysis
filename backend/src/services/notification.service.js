"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const types_1 = require("../types");
class NotificationService {
    /**
     * Create a notification
     */
    async createNotification(data) {
        try {
            await database_1.default.notification.create({
                data: {
                    userId: data.userId,
                    title: data.title,
                    message: data.message,
                    type: data.type,
                    actionUrl: data.actionUrl,
                    relatedRecordType: data.relatedRecordType,
                    relatedRecordId: data.relatedRecordId,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Failed to create notification:', error);
        }
    }
    /**
     * Get user notifications
     */
    async getUserNotifications(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [notifications, total, unreadCount] = await Promise.all([
            database_1.default.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            database_1.default.notification.count({ where: { userId } }),
            database_1.default.notification.count({ where: { userId, isRead: false } }),
        ]);
        return {
            notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get unread notification count
     */
    async getUnreadCount(userId) {
        return database_1.default.notification.count({
            where: { userId, isRead: false },
        });
    }
    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        await database_1.default.notification.updateMany({
            where: {
                id: notificationId,
                userId,
            },
            data: {
                isRead: true,
            },
        });
    }
    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId) {
        await database_1.default.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
    }
}
exports.default = new NotificationService();
//# sourceMappingURL=notification.service.js.map