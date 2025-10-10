"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validate = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            logger_1.default.warn('Validation error:', error);
            res.status(400).json({
                error: 'Validation failed',
                details: error.errors?.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                })),
            });
        }
    };
};
exports.validate = validate;
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.query);
            next();
        }
        catch (error) {
            logger_1.default.warn('Query validation error:', error);
            res.status(400).json({
                error: 'Validation failed',
                details: error.errors?.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                })),
            });
        }
    };
};
exports.validateQuery = validateQuery;
//# sourceMappingURL=validator.js.map