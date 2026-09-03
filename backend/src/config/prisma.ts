import { prisma } from '../db.js';
import { logger } from './logger.js';

export { prisma };

// Optional: Log Prisma queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: { query: string; duration: number }) => {
    logger.debug(`[Prisma Query] ${e.query} | ${e.duration}ms`);
  });
}

/**
 * Graceful shutdown handler for Prisma connection
 */
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Prisma disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting Prisma:', error);
    throw error;
  }
}
