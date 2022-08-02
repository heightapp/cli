import env from 'env';
import winston from 'winston';
import envPaths from './envPaths';

const LOG_PATH = envPaths.log;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.json(),
    winston.format.metadata(),
  ),
  transports: [
    // Write all errors logs to error file
    new winston.transports.File({ 
      dirname: LOG_PATH,
      filename: 'error.log', 
      level: 'error'
    }),
    // Write all logs to combined file
    new winston.transports.File({ 
      dirname: LOG_PATH,
      filename: 'combined.log'
    }),
  ],
});

if (!env.prod) {
  // If we're not in prod, also log to console
  logger.add(new winston.transports.Console({
    format: winston.format.cli(),
  }));
}

export default logger;