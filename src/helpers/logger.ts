import env from 'env';
import winston from 'winston';
import envPaths from './envPaths';
import path from 'path';
import colors from 'colors';
import leftPad from 'left-pad';
import 'winston-daily-rotate-file';

const LOG_PATH = envPaths.log;
const COMBINED_FILE_NAME = 'combined';
const ERROR_FILE_NAME = 'error';

export const COMBINED_LOG_FILE_PATH = path.resolve(LOG_PATH, `${COMBINED_FILE_NAME}.log`);
export const ERROR_LOG_FILE_PATH = path.resolve(LOG_PATH, `${ERROR_FILE_NAME}.log`);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.metadata(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf((info) => {
      const timestamp = colors.green(info.timestamp as string);
      const levelColor = info.level === 'error' ? colors.red : colors.blue;
      const level = levelColor(leftPad(info.level, 7));
      const message = info.message;
      const metadata = typeof info.metadata === 'object' && Object.keys(info.metadata as object).length ? colors.gray(` ${JSON.stringify(info.metadata)}`) : '';
      return `${timestamp} ${level} - ${message}${metadata}`;
    }),
  ),
  transports: [
    // Write all errors logs to error file
    new winston.transports.DailyRotateFile({
      level: 'error',
      dirname: LOG_PATH,
      filename: ERROR_FILE_NAME, 
      maxSize: '2m',
      maxFiles: 1,
      createSymlink: true,
      symlinkName: `${ERROR_FILE_NAME}.log`,
    }),
    // // Write all logs to combined file
    new winston.transports.DailyRotateFile({
      dirname: LOG_PATH,
      filename: COMBINED_FILE_NAME,
      maxSize: '2m',
      maxFiles: 1,
      createSymlink: true,
      symlinkName: `${COMBINED_FILE_NAME}.log`,
    }),
  ],
});

if (!env.prod) {
  // If we're not in prod, also log to console
  logger.add(new winston.transports.Console());
}

export default logger;