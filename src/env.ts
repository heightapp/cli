import dotenv from 'dotenv';

import path from 'path';
import {fileURLToPath} from 'url';

// Do this here instead of when running the script because watch is not run directly by us
// so it makes it difficult to run dotenv as a parameter
if (process.env.NODE_ENV === 'development') {
  const filename = fileURLToPath(import.meta.url);
  const dirname = path.dirname(filename);
  dotenv.config({path: path.resolve(dirname, '../../.env')});
}

// Defaults
const defaultWebHost = 'https://height.app';
const defaultApiHost = 'https://api.height.app';
const defaultAuthClientId = 'aL9IGyJYm4ygMy0k8Sug8mAiYE4SaewGyasS2EcsCkm';
const defaultApiScopes = ['api'];

// Setup env
const env = {
  nodeEnv: process.env.NODE_ENV === 'production' ? ('production' as const) : ('development' as const),
  apiHost: process.env.HEIGHT_API_HOST || defaultApiHost,
  webHost: process.env.HEIGHT_WEB_HOST || defaultWebHost,
  authRedirectUrl: (() => {
    const url = new URL(process.env.HEIGHT_API_HOST || defaultApiHost);
    url.pathname = 'signin/redirect';
    return url.href;
  })(),
  authScopes: defaultApiScopes,
  authClientId: process.env.HEIGHT_AUTH_CLIENT_ID || defaultAuthClientId,
  debug: process.env.HEIGHT_DEBUG || false,
};

export default env;
