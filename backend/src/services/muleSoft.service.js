"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importStar(require("axios"));
const muleSoft_1 = __importDefault(require("../config/muleSoft"));
const logger_1 = __importDefault(require("../utils/logger"));
const logging_service_1 = __importDefault(require("./logging.service"));
const types_1 = require("../types");
const helpers_1 = require("../utils/helpers");
class MuleSoftService {
    async makeRequest(endpoint, jobId, userId, jobIdParam, relatedRecordType, relatedRecordId) {
        const startTime = Date.now();
        const fullUrl = `${muleSoft_1.default.baseUrl}${endpoint}?job=${jobId}`;
        const config = {
            timeout: muleSoft_1.default.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        // Add basic auth if configured
        if (muleSoft_1.default.username && muleSoft_1.default.password) {
            config.auth = {
                username: muleSoft_1.default.username,
                password: muleSoft_1.default.password,
            };
        }
        let response;
        try {
            logger_1.default.info(`Making MuleSoft API request to ${endpoint} with jobId: ${jobId}`);
            response = await axios_1.default.post(fullUrl, {}, config);
            const duration = Date.now() - startTime;
            // Log successful API call
            await logging_service_1.default.logApiCall({
                userId,
                jobId: jobIdParam,
                requestMethod: 'POST',
                requestUrl: fullUrl,
                requestHeaders: (0, helpers_1.sanitizeHeaders)(config.headers),
                requestBody: { jobId },
                responseStatus: response.status,
                responseBody: response.data,
                responseTimeMs: duration,
                relatedRecordType,
                relatedRecordId,
            });
            logger_1.default.info(`MuleSoft API request successful (${duration}ms)`);
            return response.data;
        }
        catch (err) {
            const duration = Date.now() - startTime;
            logger_1.default.error('MuleSoft API request failed:', err.message);
            // Log failed API call
            await logging_service_1.default.logApiCall({
                userId,
                jobId: jobIdParam,
                requestMethod: 'POST',
                requestUrl: fullUrl,
                requestHeaders: (0, helpers_1.sanitizeHeaders)(config.headers),
                requestBody: { jobId },
                responseStatus: err.response?.status,
                responseBody: err.response?.data,
                responseTimeMs: duration,
                errorMessage: err.message,
                relatedRecordType,
                relatedRecordId,
            });
            throw new Error(`MuleSoft API Error: ${err.message}`);
        }
    }
    /**
     * Process contract document
     */
    async processContractDocument(jobId, userId, uploadId) {
        const endpoint = muleSoft_1.default.endpoints.processDocument;
        return this.makeRequest(endpoint, jobId, userId, jobId, 'upload', uploadId);
    }
    /**
     * Analyze data file
     */
    async analyzeDataFile(jobId, userId, analysisId) {
        const endpoint = muleSoft_1.default.endpoints.analyzeData;
        return this.makeRequest(endpoint, jobId, userId, jobId, 'contract_analysis', analysisId);
    }
    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const response = await axios_1.default.get(muleSoft_1.default.baseUrl, {
                timeout: 5000,
            });
            return response.status === 200;
        }
        catch (error) {
            logger_1.default.error('MuleSoft API connection test failed:', error);
            return false;
        }
    }
}
exports.default = new MuleSoftService();
//# sourceMappingURL=muleSoft.service.js.map