import dotenv from 'dotenv';

import path from 'path';
import {fileURLToPath} from 'url';

// Load env from file
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
dotenv.config({path: path.resolve(dirname, '../../.env')});

const defaultApiHost = 'https://api.height.app';
const apiHost = process.env.HEIGHT_API_HOST || defaultApiHost;

const env = {
  nodeEnv: process.env.NODE_ENV === 'production' ? ('production' as const) : ('development' as const),
  apiHost,
  webHost: process.env.HEIGHT_WEB_HOST || 'https://height.app',
  oauthRedirectUrl: (() => {
    const url = new URL(apiHost);
    url.pathname = 'oauth/authorizationCode';
    return url.href;
  })(),
  oauthScopes: ['api'],
  oauthClientId: process.env.HEIGHT_OAUTH_CLIENT_ID || 'aL9IGyJYm4ygMy0k8Sug8mAiYE4SaewGyasS2EcsCkm',
  debug: process.env.HEIGHT_DEBUG || false,
};

export default env;
