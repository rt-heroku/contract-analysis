"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL || '',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiration: process.env.JWT_EXPIRATION || '4h',
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    mulesoftApiBaseUrl: process.env.MULESOFT_API_BASE_URL || '',
    mulesoftApiUsername: process.env.MULESOFT_API_USERNAME || '',
    mulesoftApiPassword: process.env.MULESOFT_API_PASSWORD || '',
    mulesoftApiTimeout: parseInt(process.env.MULESOFT_API_TIMEOUT || '30000', 10),
    maxFileSizePdf: parseInt(process.env.MAX_FILE_SIZE_PDF || '10485760', 10),
    maxFileSizeExcel: parseInt(process.env.MAX_FILE_SIZE_EXCEL || '52428800', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
};
// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0 && process.env.NODE_ENV !== 'test') {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.error('Please check your .env file');
    process.exit(1);
}
exports.default = config;
//# sourceMappingURL=env.js.map