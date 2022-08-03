import dotenv from 'dotenv';
import path from 'path';

dotenv.config({path: path.resolve('.env')});

const defaultApiHost = 'https://api.height.app';
const apiHost = process.env.HEIGHT_API_HOST || defaultApiHost;

const env = {
  prod: apiHost === defaultApiHost,
  apiHost,
  webHost: process.env.HEIGHT_WEB_HOST || 'https://height.app',
  oauthRedirectUrl: (() => {
    const url = new URL(apiHost);
    url.pathname = 'oauth/authorizationCode';
    return url.href;
  })(),
  oauthScopes: ['api'],
  oauthClientId: process.env.HEIGHT_OAUTH_CLIENT_ID || 'aL9IGyJYm4ygMy0k8Sug8mAiYE4SaewGyasS2EcsCkm',
}

export default env;
