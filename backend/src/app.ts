import compression from 'compression';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/index.js';
import { morganStream } from './config/logger.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import routes from './routes/index.js';

/**
 * Initialize Express application with all middleware and routes
 */
export function initializeApp(app: Application): void {
  // Security middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  
  // CORS configuration
  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
    optionsSuccessStatus: 200
  }));

  // Compression middleware
  app.use(compression());

  // Serve uploaded datasets and extracted image assets
  app.use('/uploads', express.static(path.resolve(config.upload.uploadPath)));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP request logger
  if (config.env !== 'test') {
    app.use(morgan('combined', { stream: morganStream }));
  }

  // Rate limiting
  app.use(rateLimiter);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env
    });
  });

  // API Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }'
  }));

  // API routes
  app.use(`/api/${config.apiVersion}`, routes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);
}
