import keytar from 'keytar';
import logger from './logger';

type Credentials = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    id: string,
    email: string,
  }
}

const ACCOUNT = 'height';
const SERVICE = 'height-cli';

const getCredentials = async () => {
  logger.info('Get credentials');

  const json = await keytar.getPassword(SERVICE, ACCOUNT)
  if (!json) {
    return null;
  }

  try {
    const credentials = JSON.parse(json);
    if (typeof credentials.accessToken !== 'string' || typeof credentials.refreshToken !== 'string' || typeof credentials.expiresAt !== 'number') {
      return null;
    }
    return credentials as Credentials;
  } catch {
    // Ignore
    return null;
  }
};

const setCredentials = async (credentials: Credentials) => {
  logger.info('Set credentials');

  try {
    const json = JSON.stringify(credentials);
    return keytar.setPassword(SERVICE, ACCOUNT, json)
  } catch {
    // Ignore
  }

};

const clearCredentials = async() => {
  logger.info('Clear credentials');
  return keytar.deletePassword(SERVICE, ACCOUNT)
};

export default {
  getCredentials,
  setCredentials,
  clearCredentials,
};
