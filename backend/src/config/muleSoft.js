"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = __importDefault(require("./env"));
const muleSoftConfig = {
    baseUrl: env_1.default.mulesoftApiBaseUrl,
    username: env_1.default.mulesoftApiUsername,
    password: env_1.default.mulesoftApiPassword,
    timeout: env_1.default.mulesoftApiTimeout,
    endpoints: {
        processDocument: '/process/document',
        analyzeData: '/analyze',
    },
};
exports.default = muleSoftConfig;
//# sourceMappingURL=muleSoft.js.map