import Client from '@heightapp/client';
import env from 'env';
import logger from 'helpers/logger';

const createClient = (refreshToken: string) => {
  return new Client({
    refreshToken,
    clientId: env.authClientId,
    redirectUri: env.authRedirectUrl,
    scopes: env.authScopes,
    logger,
  });
};

export default createClient;
