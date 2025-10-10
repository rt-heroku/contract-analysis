"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const types_1 = require("../types");
const document_service_1 = __importDefault(require("../services/document.service"));
const logging_service_1 = __importDefault(require("../services/logging.service"));
const constants_1 = require("../utils/constants");
const helpers_1 = require("../utils/helpers");
class AnalysisController {
    async startProcessing(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const { contractUploadId, dataUploadId } = req.body;
            if (!contractUploadId || !dataUploadId) {
                return res.status(400).json({
                    error: 'Both contract and data upload IDs are required',
                });
            }
            const result = await document_service_1.default.startProcessing(req.user.id, parseInt(contractUploadId), parseInt(dataUploadId));
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            // Log activity
            await logging_service_1.default.logActivity({
                userId: req.user.id,
                actionType: constants_1.ACTION_TYPES.PROCESSING.START,
                actionDescription: 'Started document processing',
                ipAddress: (0, helpers_1.getClientIp)(req),
                userAgent: (0, helpers_1.getUserAgent)(req),
                metadata: {
                    contractUploadId,
                    dataUploadId,
                    analysisRecordId: result.analysisRecordId,
                },
            });
            res.status(202).json({
                message: 'Processing started',
                analysisRecordId: result.analysisRecordId,
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAnalysis(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const analysisId = parseInt(req.params.id);
            // Check if user has admin role
            const isAdmin = req.user.roles.includes('admin');
            const analysis = await document_service_1.default.getAnalysisById(analysisId, isAdmin ? undefined : req.user.id);
            if (!analysis) {
                return res.status(404).json({ error: 'Analysis not found' });
            }
            // Log activity
            await logging_service_1.default.logActivity({
                userId: req.user.id,
                actionType: constants_1.ACTION_TYPES.ANALYSIS.VIEW,
                actionDescription: `Viewed analysis #${analysisId}`,
                ipAddress: (0, helpers_1.getClientIp)(req),
                userAgent: (0, helpers_1.getUserAgent)(req),
            });
            res.json({ analysis });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAnalysisHistory(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const search = req.query.search;
            const result = await document_service_1.default.getUserAnalysisHistory(req.user.id, page, limit, search);
            // Log activity
            await logging_service_1.default.logActivity({
                userId: req.user.id,
                actionType: constants_1.ACTION_TYPES.ANALYSIS.VIEW_LIST,
                actionDescription: 'Viewed analysis history',
                ipAddress: (0, helpers_1.getClientIp)(req),
                userAgent: (0, helpers_1.getUserAgent)(req),
            });
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async deleteAnalysis(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const analysisId = parseInt(req.params.id);
            await document_service_1.default.deleteAnalysis(analysisId, req.user.id);
            // Log activity
            await logging_service_1.default.logActivity({
                userId: req.user.id,
                actionType: constants_1.ACTION_TYPES.ANALYSIS.DELETE,
                actionDescription: `Deleted analysis #${analysisId}`,
                ipAddress: (0, helpers_1.getClientIp)(req),
                userAgent: (0, helpers_1.getUserAgent)(req),
            });
            res.json({ message: 'Analysis deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getStatistics(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const stats = await document_service_1.default.getStatistics(req.user.id);
            res.json({ statistics: stats });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.default = new AnalysisController();
//# sourceMappingURL=analysis.controller.js.map