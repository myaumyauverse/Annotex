import express, { Application } from 'express';
import 'reflect-metadata';
import { initializeApp } from './app.js';
import { prisma, disconnectPrisma } from './config/prisma.js';
import { logger } from './config/logger.js';

const PORT = process.env.PORT || 5000;
const allowDegradedStartup = process.env.ALLOW_DEGRADED_STARTUP === 'true';

/**
 * Bootstrap the application
 */
async function bootstrap(): Promise<void> {
  try {
    // Test Prisma connection at startup.
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('Prisma database connection established successfully');
    } catch (error) {
      if (!allowDegradedStartup) {
        throw error;
      }

      logger.warn('Prisma database is unavailable at startup. Continuing because ALLOW_DEGRADED_STARTUP=true.', error);
    }

    // Create Express app
    const app: Application = express();

    // Initialize middleware, routes, and error handlers
    initializeApp(app);

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await disconnectPrisma();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap();

