import winston from 'winston';
import { config } from './config.js';

export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sourcemesh' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Add file transport in production
    ...(config.nodeEnv === 'production'
      ? [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })]
      : []),
  ],
});

export default logger;
