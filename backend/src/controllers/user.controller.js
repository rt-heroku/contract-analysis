"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const types_1 = require("../types");
const user_service_1 = __importDefault(require("../services/user.service"));
const auth_service_1 = __importDefault(require("../services/auth.service"));
const logging_service_1 = __importDefault(require("../services/logging.service"));
const constants_1 = require("../utils/constants");
const helpers_1 = require("../utils/helpers");
class UserController {
    async getProfile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const profile = await user_service_1.default.getUserProfile(req.user.id);
            // Log activity
            await logging_service_1.default.logActivity({
                userId: req.user.id,
                actionType: constants_1.ACTION_TYPES.USER.VIEW_PROFILE,
                actionDescription: 'Viewed profile',
                ipAddress: (0, helpers_1.getClientIp)(req),
                userAgent: (0, helpers_1.getUserAgent)(req),
            });
            res.json({ profile });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updateProfile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const profile = await user_service_1.default.updateUserProfile(req.user.id, req.body);
            // Log activity
            await logging_service_1.default.logActivity({
                userId: req.user.id,
                actionType: constants_1.ACTION_TYPES.USER.UPDATE_PROFILE,
                actionDescription: 'Updated profile',
                ipAddress: (0, helpers_1.getClientIp)(req),
                userAgent: (0, helpers_1.getUserAgent)(req),
                metadata: req.body,
            });
            res.json({
                message: 'Profile updated successfully',
                profile,
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updateAvatar(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const { avatarBase64 } = req.body;
            if (!avatarBase64) {
                return res.status(400).json({ error: 'Avatar data is required' });
            }
            await user_service_1.default.updateAvatar(req.user.id, avatarBase64);
            // Log activity
            await logging_service_1.default.logActivity({
                userId: req.user.id,
                actionType: constants_1.ACTION_TYPES.USER.UPDATE_AVATAR,
                actionDescription: 'Updated avatar',
                ipAddress: (0, helpers_1.getClientIp)(req),
                userAgent: (0, helpers_1.getUserAgent)(req),
            });
            res.json({ message: 'Avatar updated successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async changePassword(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const { currentPassword, newPassword } = req.body;
            await auth_service_1.default.changePassword(req.user.id, currentPassword, newPassword);
            // Log activity
            await logging_service_1.default.logActivity({
                userId: req.user.id,
                actionType: constants_1.ACTION_TYPES.USER.CHANGE_PASSWORD,
                actionDescription: 'Changed password',
                ipAddress: (0, helpers_1.getClientIp)(req),
                userAgent: (0, helpers_1.getUserAgent)(req),
            });
            res.json({ message: 'Password changed successfully. Please login again.' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getActivityLogs(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const result = await logging_service_1.default.getUserActivityLogs(req.user.id, page, limit);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.default = new UserController();
//# sourceMappingURL=user.controller.js.map