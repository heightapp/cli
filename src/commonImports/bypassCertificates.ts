import env from 'env';
import https from 'https';
import logger from 'helpers/logger';

// Allow self-signed certs in dev
if (env.nodeEnv !== 'production') {
  logger.info('Running in dev mode, allowing self-signed certs');
  https.globalAgent.options.rejectUnauthorized = false;
}
