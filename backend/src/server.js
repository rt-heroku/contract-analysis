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
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = __importDefault(require("./config/env"));
const logger_1 = __importDefault(require("./utils/logger"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const database_1 = __importDefault(require("./config/database"));
const static_1 = require("./config/static");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: env_1.default.corsOrigin,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Request logging
app.use((req, _res, next) => {
    logger_1.default.info(`${req.method} ${req.path}`);
    next();
});
// API Routes
app.use('/api', routes_1.default);
// Health check (before static files)
app.get('/health', (_req, res) => {
    res.json({
        message: 'Document Processing API',
        version: '1.0.0',
        status: 'running',
        environment: env_1.default.nodeEnv,
    });
});
// Serve frontend static files in production
(0, static_1.setupStaticFiles)(app);
// Error handling
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
// Start server
const PORT = env_1.default.port;
const startServer = async () => {
    try {
        // Test database connection
        await database_1.default.$connect();
        logger_1.default.info('Database connected successfully');
        // Clean expired sessions on startup
        const cleanupInterval = setInterval(async () => {
            try {
                await database_1.default.session.deleteMany({
                    where: {
                        expiresAt: {
                            lt: new Date(),
                        },
                    },
                });
            }
            catch (error) {
                logger_1.default.error('Session cleanup error:', error);
            }
        }, 60 * 60 * 1000); // Run every hour
        // Start server
        app.listen(PORT, () => {
            logger_1.default.info(`Server running on port ${PORT}`);
            logger_1.default.info(`Environment: ${env_1.default.nodeEnv}`);
        });
        // Graceful shutdown
        process.on('SIGINT', async () => {
            logger_1.default.info('Shutting down gracefully...');
            clearInterval(cleanupInterval);
            await database_1.default.$disconnect();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            logger_1.default.info('Shutting down gracefully...');
            clearInterval(cleanupInterval);
            await database_1.default.$disconnect();
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map