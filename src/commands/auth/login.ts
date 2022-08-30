import Client from '@heightapp/client';
import createClient from 'clientHelpers/createClient';
import env from 'env';
import keychain from 'helpers/keychain';
import logger from 'helpers/logger';
import output from 'helpers/output';
import open from 'open';
import {CommandModule} from 'yargs';

type Command = CommandModule<object, object>;

const handler: Command['handler'] = async () => {
  const existingCredentials = await keychain.getCredentials();
  if (existingCredentials) {
    logger.info('Tried to log in but already logged in');
    output('You are already logged in.');
    return;
  }

  const {code, codeVerifier} = await Client.openAuthentication({
    source: 'client',
    handleViaRedirectUri: false,
    clientId: env.oauthClientId,
    redirectUri: env.oauthRedirectUrl,
    scopes: env.oauthScopes,
    state: {
      description: 'Please return to the CLI',
    },
    logger,
    onOpenUrl: open,
  });

  // Create tokens
  const credentials = await Client.createTokens({
    code,
    codeVerifier,
    clientId: env.oauthClientId,
    redirectUri: env.oauthRedirectUrl,
    scopes: env.oauthScopes,
    logger,
  });

  // Get userId
  const client = createClient(credentials.refreshToken);
  const user = await client.user.get();

  // Save credentials and user in config
  logger.info('Save credentials and user');
  await keychain.setCredentials({
    refreshToken: credentials.refreshToken,
    user: {id: user.id, email: user.email},
  });

  logger.info(`User is logged in: ${user.email}`);
  output('You are logged in.');
};

const command: Command = {
  command: 'login',
  describe: 'Authenticate a user with Height',
  handler,
};

export default command;
