"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const types_1 = require("../types");
const notification_service_1 = __importDefault(require("../services/notification.service"));
const logging_service_1 = __importDefault(require("../services/logging.service"));
const constants_1 = require("../utils/constants");
const helpers_1 = require("../utils/helpers");
class NotificationController {
    async getNotifications(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await notification_service_1.default.getUserNotifications(req.user.id, page, limit);
            // Log activity
            await logging_service_1.default.logActivity({
                userId: req.user.id,
                actionType: constants_1.ACTION_TYPES.NOTIFICATION.VIEW,
                actionDescription: 'Viewed notifications',
                ipAddress: (0, helpers_1.getClientIp)(req),
                userAgent: (0, helpers_1.getUserAgent)(req),
            });
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getUnreadCount(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const count = await notification_service_1.default.getUnreadCount(req.user.id);
            res.json({ unreadCount: count });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async markAsRead(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const notificationId = parseInt(req.params.id);
            await notification_service_1.default.markAsRead(notificationId, req.user.id);
            // Log activity
            await logging_service_1.default.logActivity({
                userId: req.user.id,
                actionType: constants_1.ACTION_TYPES.NOTIFICATION.MARK_READ,
                actionDescription: `Marked notification #${notificationId} as read`,
                ipAddress: (0, helpers_1.getClientIp)(req),
                userAgent: (0, helpers_1.getUserAgent)(req),
            });
            res.json({ message: 'Notification marked as read' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async markAllAsRead(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            await notification_service_1.default.markAllAsRead(req.user.id);
            // Log activity
            await logging_service_1.default.logActivity({
                userId: req.user.id,
                actionType: constants_1.ACTION_TYPES.NOTIFICATION.MARK_READ,
                actionDescription: 'Marked all notifications as read',
                ipAddress: (0, helpers_1.getClientIp)(req),
                userAgent: (0, helpers_1.getUserAgent)(req),
            });
            res.json({ message: 'All notifications marked as read' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.default = new NotificationController();
//# sourceMappingURL=notification.controller.js.map