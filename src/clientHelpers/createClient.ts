import Client from '@heightapp/client';
import env from 'env';
import logger from 'helpers/logger';

const createClient = (refreshToken: string) => {
  return new Client({
    refreshToken,
    clientId: env.oauthClientId,
    redirectUri: env.oauthRedirectUrl,
    scopes: env.oauthScopes,
    logger,
  });
};

export default createClient;
