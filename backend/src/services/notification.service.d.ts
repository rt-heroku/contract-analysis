import { NotificationData } from '../types';
declare class NotificationService {
    /**
     * Create a notification
     */
    createNotification(data: NotificationData): Promise<void>;
    /**
     * Get user notifications
     */
    getUserNotifications(userId: number, page?: number, limit?: number): Promise<{
        notifications: {
            message: string;
            id: number;
            createdAt: Date;
            userId: number;
            relatedRecordType: string | null;
            relatedRecordId: number | null;
            type: string;
            title: string;
            isRead: boolean;
            actionUrl: string | null;
        }[];
        unreadCount: number;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Get unread notification count
     */
    getUnreadCount(userId: number): Promise<number>;
    /**
     * Mark notification as read
     */
    markAsRead(notificationId: number, userId: number): Promise<void>;
    /**
     * Mark all notifications as read
     */
    markAllAsRead(userId: number): Promise<void>;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=notification.service.d.ts.map