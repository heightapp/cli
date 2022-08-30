import Client from '@heightapp/client';
import env from 'env';

// Override client hosts for dev environments
if (env.nodeEnv === 'development') {
  Client.setupHostsForDev({
    apiHost: env.apiHost,
    webHost: env.webHost,
  });
}
