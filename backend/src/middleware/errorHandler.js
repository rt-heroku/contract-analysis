"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const express_1 = require("express");
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (error, _req, res, _next) => {
    logger_1.default.error('Unhandled error:', error);
    // Default error response
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        error: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
};
exports.errorHandler = errorHandler;
const notFound = (_req, res, _next) => {
    res.status(404).json({ error: 'Route not found' });
};
exports.notFound = notFound;
//# sourceMappingURL=errorHandler.js.map