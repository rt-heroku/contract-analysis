"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const express_1 = require("express");
const types_1 = require("../types");
const logging_service_1 = __importDefault(require("../services/logging.service"));
const helpers_1 = require("../utils/helpers");
const logActivity = (actionType, getDescription) => {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;
        // Override send function to log after response
        res.send = function (body) {
            // Only log if response was successful (2xx status)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logging_service_1.default
                    .logActivity({
                    userId: req.user?.id,
                    actionType,
                    actionDescription: getDescription(req),
                    ipAddress: (0, helpers_1.getClientIp)(req),
                    userAgent: (0, helpers_1.getUserAgent)(req),
                    metadata: {
                        method: req.method,
                        path: req.path,
                        params: req.params,
                        query: req.query,
                    },
                    status: 'success',
                })
                    .catch((error) => {
                    console.error('Failed to log activity:', error);
                });
            }
            // Call original send
            return originalSend.call(this, body);
        };
        next();
    };
};
exports.logActivity = logActivity;
//# sourceMappingURL=activityLogger.js.map