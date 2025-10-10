"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'error',
        },
        {
            emit: 'event',
            level: 'warn',
        },
    ],
});
// Log database queries in development
if (process.env.NODE_ENV !== 'production') {
    prisma.$on('query', (e) => {
        logger_1.default.debug('Query: ' + e.query);
        logger_1.default.debug('Duration: ' + e.duration + 'ms');
    });
}
prisma.$on('error', (e) => {
    logger_1.default.error('Database Error:', e);
});
prisma.$on('warn', (e) => {
    logger_1.default.warn('Database Warning:', e);
});
exports.default = prisma;
//# sourceMappingURL=database.js.map