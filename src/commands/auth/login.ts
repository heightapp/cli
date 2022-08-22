import env from 'env';
import pkceChallenge from 'pkce-challenge';
import open from 'open';
import ClientError, { ClientErrorCode } from 'client/helpers/clientError';
import sharedClient from 'helpers/sharedClient';
import output from 'helpers/output';
import Client from 'client';
import config from 'helpers/config';
import keychain from 'helpers/keychain';
import logger from 'helpers/logger';

const GET_AUTHORIZATION_CODE_INTERVAL = 3000;

// Try to get auth code every `GET_AUTHORIZATION_CODE_INTERVAL` interval
const getAuthorizationCode = (readKey: string) => {
  return new Promise<string>((resolve) => {
    setTimeout(async () => {
      try {
        const {code} = await sharedClient.auth.authorizationCode.get({readKey})
        resolve(code);
      } catch (e) {
        if (e instanceof ClientError && e.code === ClientErrorCode.AuthorizationCodeMissing) {
          // Retry
          resolve(getAuthorizationCode(readKey));
        } else {
          throw e
        }
      }
    }, GET_AUTHORIZATION_CODE_INTERVAL)
  })
}

const login = async () => {
  const existingCredentials = await keychain.getCredentials();
  if (existingCredentials) {
    logger.info('Tried to log in but already logged in');
    output('You are already logged in.');
    return;
  }

  const {readKey, writeKey} = await sharedClient.auth.authorizationCodeKeys.get();
  const {code_verifier, code_challenge} = ((pkceChallenge as any).default as typeof pkceChallenge)(); // pkce-challenge is a commonjs module

  // Open oauth
  logger.info('Open oauth url');
  const url = new URL(env.webHost);
  url.pathname = 'oauth/authorization';
  url.searchParams.set('client_id', env.oauthClientId);
  url.searchParams.set('redirect_uri', env.oauthRedirectUrl);
  url.searchParams.set('scope', `[${env.oauthScopes.toString()}]`);
  url.searchParams.set(
    'state',
    JSON.stringify({
      writeKey,
      description: 'Please return to the CLI',
    }),
  );
  url.searchParams.set('code_challenge', code_challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  open(url.href);

  // Wait for the code to be available
  const code = await getAuthorizationCode(readKey)

  // Create tokens
  const credentials = await sharedClient.auth.accessToken.create({code, codeVerifier: code_verifier});

  // Get userId
  const client = new Client(credentials);
  const user = await client.user.get();

  // Save credentials and user in config
  logger.info('Save credentials and user');
  await Promise.all([
    keychain.setCredentials(credentials),
    config.set('user', {id: user.id, email: user.email})
  ])

  logger.info(`User is logged in: ${user.email}`);
  output('You are logged in.');
};

export default login;
