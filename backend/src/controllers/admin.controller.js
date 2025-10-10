"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const types_1 = require("../types");
const user_service_1 = __importDefault(require("../services/user.service"));
const logging_service_1 = __importDefault(require("../services/logging.service"));
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../utils/constants");
const helpers_1 = require("../utils/helpers");
class AdminController {
    async getUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const search = req.query.search;
            const result = await user_service_1.default.getAllUsers(page, limit, search);
            // Log activity
            if (req.user) {
                await logging_service_1.default.logActivity({
                    userId: req.user.id,
                    actionType: constants_1.ACTION_TYPES.ADMIN.VIEW_USERS,
                    actionDescription: 'Viewed user list',
                    ipAddress: (0, helpers_1.getClientIp)(req),
                    userAgent: (0, helpers_1.getUserAgent)(req),
                });
            }
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const user = await user_service_1.default.getUserById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Log activity
            if (req.user) {
                await logging_service_1.default.logActivity({
                    userId: req.user.id,
                    actionType: constants_1.ACTION_TYPES.ADMIN.VIEW_USER,
                    actionDescription: `Viewed user #${userId}`,
                    ipAddress: (0, helpers_1.getClientIp)(req),
                    userAgent: (0, helpers_1.getUserAgent)(req),
                });
            }
            res.json({ user });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updateUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const user = await user_service_1.default.updateUser(userId, req.body);
            // Log activity
            if (req.user) {
                await logging_service_1.default.logActivity({
                    userId: req.user.id,
                    actionType: constants_1.ACTION_TYPES.ADMIN.UPDATE_USER,
                    actionDescription: `Updated user #${userId}`,
                    ipAddress: (0, helpers_1.getClientIp)(req),
                    userAgent: (0, helpers_1.getUserAgent)(req),
                    metadata: req.body,
                });
            }
            res.json({
                message: 'User updated successfully',
                user,
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async deleteUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            await user_service_1.default.deleteUser(userId);
            // Log activity
            if (req.user) {
                await logging_service_1.default.logActivity({
                    userId: req.user.id,
                    actionType: constants_1.ACTION_TYPES.ADMIN.DELETE_USER,
                    actionDescription: `Deleted user #${userId}`,
                    ipAddress: (0, helpers_1.getClientIp)(req),
                    userAgent: (0, helpers_1.getUserAgent)(req),
                });
            }
            res.json({ message: 'User deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async resetUserPassword(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const { newPassword } = req.body;
            if (!newPassword) {
                return res.status(400).json({ error: 'New password is required' });
            }
            await user_service_1.default.resetUserPassword(userId, newPassword);
            // Log activity
            if (req.user) {
                await logging_service_1.default.logActivity({
                    userId: req.user.id,
                    actionType: constants_1.ACTION_TYPES.ADMIN.UPDATE_USER,
                    actionDescription: `Reset password for user #${userId}`,
                    ipAddress: (0, helpers_1.getClientIp)(req),
                    userAgent: (0, helpers_1.getUserAgent)(req),
                });
            }
            res.json({ message: 'Password reset successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getActivityLogs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const filters = {};
            if (req.query.userId)
                filters.userId = parseInt(req.query.userId);
            if (req.query.actionType)
                filters.actionType = req.query.actionType;
            if (req.query.startDate)
                filters.startDate = new Date(req.query.startDate);
            if (req.query.endDate)
                filters.endDate = new Date(req.query.endDate);
            const result = await logging_service_1.default.getAllActivityLogs(filters, page, limit);
            // Log activity
            if (req.user) {
                await logging_service_1.default.logActivity({
                    userId: req.user.id,
                    actionType: constants_1.ACTION_TYPES.ADMIN.VIEW_LOGS,
                    actionDescription: 'Viewed activity logs',
                    ipAddress: (0, helpers_1.getClientIp)(req),
                    userAgent: (0, helpers_1.getUserAgent)(req),
                });
            }
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getApiLogs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const filters = {};
            if (req.query.userId)
                filters.userId = parseInt(req.query.userId);
            if (req.query.status)
                filters.status = parseInt(req.query.status);
            if (req.query.startDate)
                filters.startDate = new Date(req.query.startDate);
            if (req.query.endDate)
                filters.endDate = new Date(req.query.endDate);
            const result = await logging_service_1.default.getApiLogs(filters, page, limit);
            // Log activity
            if (req.user) {
                await logging_service_1.default.logActivity({
                    userId: req.user.id,
                    actionType: constants_1.ACTION_TYPES.ADMIN.VIEW_API_LOGS,
                    actionDescription: 'Viewed API logs',
                    ipAddress: (0, helpers_1.getClientIp)(req),
                    userAgent: (0, helpers_1.getUserAgent)(req),
                });
            }
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getSystemSettings(_req, res) {
        try {
            const settings = await database_1.default.systemSetting.findMany({
                where: { isSecret: false },
            });
            res.json({ settings });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.default = new AdminController();
//# sourceMappingURL=admin.controller.js.map