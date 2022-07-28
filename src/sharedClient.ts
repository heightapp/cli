import Client from 'client/index'
import config from 'config';

const credentials = await config.get('credentials');

const sharedClient = new Client(
  credentials ? {
    accessToken: credentials.accessToken,
    refreshToken: credentials.refreshToken,
    expiresAt: credentials.expiresAt,
  } : null, async (newCredentials) => {
    if (newCredentials) {
      await config.set('credentials', newCredentials);
    } else {
      await config.clear('credentials');
    }
  }
);

export default sharedClient;
