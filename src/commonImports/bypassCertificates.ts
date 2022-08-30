import env from 'env';
import logger from 'helpers/logger';

import https from 'https';

// Allow self-signed certs in dev
if (env.nodeEnv !== 'production') {
  logger.info('Running in dev mode, allowing self-signed certs');
  https.globalAgent.options.rejectUnauthorized = false;
}
