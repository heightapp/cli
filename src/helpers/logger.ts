import env from 'env';
import winston from 'winston';
import envPaths from './envPaths';
import path from 'path';

const LOG_PATH = envPaths.log;
const COMBINED_FILE_NAME = 'combined.log';
const ERROR_FILE_NAME = 'error.log';

export const COMBINED_LOG_FILE_PATH = path.resolve(LOG_PATH, COMBINED_FILE_NAME);
export const ERROR_LOG_FILE_PATH = path.resolve(LOG_PATH, ERROR_FILE_NAME);

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
      filename: ERROR_FILE_NAME, 
      level: 'error'
    }),
    // Write all logs to combined file
    new winston.transports.File({ 
      dirname: LOG_PATH,
      filename: COMBINED_FILE_NAME
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