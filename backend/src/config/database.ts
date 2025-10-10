import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient({
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
  prisma.$on('query' as never, (e: any) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

prisma.$on('error' as never, (e: any) => {
  logger.error('Database Error:', e);
});

prisma.$on('warn' as never, (e: any) => {
  logger.warn('Database Warning:', e);
});

export default prisma;

