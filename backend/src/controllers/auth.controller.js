"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const types_1 = require("../types");
const auth_service_1 = __importDefault(require("../services/auth.service"));
const logging_service_1 = __importDefault(require("../services/logging.service"));
const constants_1 = require("../utils/constants");
const helpers_1 = require("../utils/helpers");
class AuthController {
    async register(req, res) {
        try {
            const user = await auth_service_1.default.register(req.body);
            // Log registration
            await logging_service_1.default.logActivity({
                userId: user.id,
                actionType: constants_1.ACTION_TYPES.AUTH.REGISTER,
                actionDescription: `User registered: ${user.email}`,
                ipAddress: (0, helpers_1.getClientIp)(req),
                userAgent: (0, helpers_1.getUserAgent)(req),
            });
            res.status(201).json({
                message: 'Registration successful',
                user,
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async login(req, res) {
        try {
            const ipAddress = (0, helpers_1.getClientIp)(req);
            const userAgent = (0, helpers_1.getUserAgent)(req);
            const result = await auth_service_1.default.login(req.body, ipAddress, userAgent);
            // Log login
            await logging_service_1.default.logActivity({
                userId: result.user.id,
                actionType: constants_1.ACTION_TYPES.AUTH.LOGIN,
                actionDescription: `User logged in: ${result.user.email}`,
                ipAddress,
                userAgent,
                metadata: {
                    stayLoggedIn: req.body.stayLoggedIn || false,
                },
            });
            res.json({
                message: 'Login successful',
                token: result.token,
                expiresAt: result.expiresAt,
                user: result.user,
            });
        }
        catch (error) {
            // Log failed login
            await logging_service_1.default.logActivity({
                actionType: constants_1.ACTION_TYPES.AUTH.LOGIN_FAILED,
                actionDescription: `Failed login attempt: ${req.body.email}`,
                ipAddress: (0, helpers_1.getClientIp)(req),
                userAgent: (0, helpers_1.getUserAgent)(req),
                status: 'failed',
            });
            res.status(401).json({ error: error.message });
        }
    }
    async logout(req, res) {
        try {
            const token = req.headers.authorization?.substring(7);
            if (token) {
                await auth_service_1.default.logout(token);
                // Log logout
                if (req.user) {
                    await logging_service_1.default.logActivity({
                        userId: req.user.id,
                        actionType: constants_1.ACTION_TYPES.AUTH.LOGOUT,
                        actionDescription: `User logged out: ${req.user.email}`,
                        ipAddress: (0, helpers_1.getClientIp)(req),
                        userAgent: (0, helpers_1.getUserAgent)(req),
                    });
                }
            }
            res.json({ message: 'Logout successful' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async refreshToken(req, res) {
        try {
            const oldToken = req.headers.authorization?.substring(7);
            if (!oldToken) {
                return res.status(401).json({ error: 'No token provided' });
            }
            const ipAddress = (0, helpers_1.getClientIp)(req);
            const userAgent = (0, helpers_1.getUserAgent)(req);
            const result = await auth_service_1.default.refreshToken(oldToken, ipAddress, userAgent);
            // Log token refresh
            if (req.user) {
                await logging_service_1.default.logActivity({
                    userId: req.user.id,
                    actionType: constants_1.ACTION_TYPES.AUTH.REFRESH,
                    actionDescription: `Token refreshed for user: ${req.user.email}`,
                    ipAddress,
                    userAgent,
                });
            }
            res.json({
                message: 'Token refreshed',
                token: result.token,
                expiresAt: result.expiresAt,
            });
        }
        catch (error) {
            res.status(401).json({ error: error.message });
        }
    }
    async getCurrentUser(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            res.json({ user: req.user });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.default = new AuthController();
//# sourceMappingURL=auth.controller.js.map