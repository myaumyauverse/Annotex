import path from 'path';
import winston from 'winston';
import { config } from './index.js';

/**
 * Winston logger configuration
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'annotex-backend' },
  transports:
    config.env === 'test'
      ? [
          new winston.transports.Console({
            silent: true,
          }),
        ]
      : [
          // Write all logs to console
          new winston.transports.Console({
            format: consoleFormat,
          }),
          // Write all logs with level 'error' and below to error.log
          new winston.transports.File({
            filename: path.join(config.logging.filePath, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          // Write all logs to combined.log
          new winston.transports.File({
            filename: path.join(config.logging.filePath, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ],
  exceptionHandlers:
    config.env === 'test'
      ? []
      : [
          new winston.transports.File({
            filename: path.join(config.logging.filePath, 'exceptions.log'),
          }),
        ],
  rejectionHandlers:
    config.env === 'test'
      ? []
      : [
          new winston.transports.File({
            filename: path.join(config.logging.filePath, 'rejections.log'),
          }),
        ],
});

// Create a stream object for Morgan
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
