"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = exports.authenticateToken = void 0;
const express_1 = require("express");
const types_1 = require("../types");
const auth_service_1 = __importDefault(require("../services/auth.service"));
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const token = authHeader.substring(7);
        // Verify token
        const payload = auth_service_1.default.verifyToken(token);
        // Check if session exists and is valid
        const session = await database_1.default.session.findFirst({
            where: {
                token,
                userId: payload.id,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });
        if (!session) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }
        // Check if user is active
        const user = await database_1.default.user.findUnique({
            where: { id: payload.id },
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'User account is disabled' });
        }
        // Attach user to request
        req.user = payload;
        next();
    }
    catch (error) {
        logger_1.default.error('Authentication error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};
exports.authenticateToken = authenticateToken;
exports.authenticate = exports.authenticateToken;
const optionalAuthenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = auth_service_1.default.verifyToken(token);
            const session = await database_1.default.session.findFirst({
                where: {
                    token,
                    userId: payload.id,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            });
            if (session) {
                req.user = payload;
            }
        }
        next();
    }
    catch (error) {
        // If authentication fails, continue without user
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
//# sourceMappingURL=auth.js.map