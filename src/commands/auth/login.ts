import Client from 'client';
import ClientError, {ClientErrorCode} from 'client/helpers/clientError';
import env from 'env';
import keychain from 'helpers/keychain';
import logger from 'helpers/logger';
import output from 'helpers/output';
import sharedClient from 'helpers/sharedClient';
import open from 'open';
import pkceChallenge from 'pkce-challenge';
import {CommandModule} from 'yargs';

type Command = CommandModule<object, object>

const GET_AUTHORIZATION_CODE_INTERVAL = 3000;

// Try to get auth code every `GET_AUTHORIZATION_CODE_INTERVAL` interval
const getAuthorizationCode = (readKey: string) => {
  return new Promise<string>((resolve, reject) => {
    setTimeout(async () => {
      try {
        const {code} = await sharedClient.auth.authorizationCode.get({readKey});
        resolve(code);
      } catch (e) {
        if (e instanceof ClientError && e.code === ClientErrorCode.AuthorizationCodeMissing) {
          // Retry
          resolve(getAuthorizationCode(readKey));
        } else {
          reject(e);
        }
      }
    }, GET_AUTHORIZATION_CODE_INTERVAL);
  });
};

const handler: Command['handler'] = async () => {
  const existingCredentials = await keychain.getCredentials();
  if (existingCredentials) {
    logger.info('Tried to log in but already logged in');
    output('You are already logged in.');
    return;
  }

  const {readKey, writeKey} = await sharedClient.auth.authorizationCodeKeys.get();
  const {code_verifier: codeVerifier, code_challenge: codeChallenge} = ((pkceChallenge as any).default as typeof pkceChallenge)(); // pkce-challenge is a commonjs module

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
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  await open(url.href);

  // Wait for the code to be available
  let code: string;
  try {
    code = await getAuthorizationCode(readKey);
  } catch (e) {
    if (e instanceof ClientError && e.status === 404) {
      output('You seem to have denied access.', 'Please try again of contact support if you think this is an error.');
      return;
    }

    throw e;
  }

  // Create tokens
  const credentials = await sharedClient.auth.accessToken.create({code, codeVerifier});

  // Get userId
  const client = new Client(credentials);
  const user = await client.user.get();

  // Save credentials and user in config
  logger.info('Save credentials and user');
  await keychain.setCredentials({...credentials, user: {id: user.id, email: user.email}});

  logger.info(`User is logged in: ${user.email}`);
  output('You are logged in.');
};

const command: Command = {
  command: 'login',
  describe: 'Authenticate a user with Height',
  handler,
};

export default command;

