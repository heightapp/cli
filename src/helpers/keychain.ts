import env from 'env';
import keytar from 'keytar';

import logger from './logger';

type Credentials = {
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
};

const ACCOUNT = 'height';
const SERVICE = env.nodeEnv === 'production' ? 'height-cli' : 'height-cli-dev';

const getCredentials = async () => {
  logger.info('Get credentials');

  const json = await keytar.getPassword(SERVICE, ACCOUNT);
  if (!json) {
    return null;
  }

  try {
    return JSON.parse(json) as Credentials;
  } catch {
    // Ignore
    return null;
  }
};

const setCredentials = async (credentials: Credentials) => {
  logger.info('Set credentials');

  try {
    const json = JSON.stringify(credentials);
    await keytar.setPassword(SERVICE, ACCOUNT, json);
  } catch {
    // Ignore
  }
};

const clearCredentials = async () => {
  logger.info('Clear credentials');
  return keytar.deletePassword(SERVICE, ACCOUNT);
};

export default {
  getCredentials,
  setCredentials,
  clearCredentials,
};
