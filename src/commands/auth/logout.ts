import createClient from 'clientHelpers/createClient';
import config from 'helpers/config';
import keychain from 'helpers/keychain';
import logger from 'helpers/logger';
import output from 'helpers/output';
import {CommandModule} from 'yargs';

type Command = CommandModule<object, object>;

const handler: Command['handler'] = async () => {
  const existingCredentials = await keychain.getCredentials();
  if (!existingCredentials) {
    logger.info('Tried to log out but is not logged in');
    output('You are not logged in.');
    return;
  }

  // Revoke the credentials and clear them
  try {
    await createClient(existingCredentials.refreshToken).auth.revoke(existingCredentials.refreshToken);
  } finally {
    await Promise.all([keychain.clearCredentials(), config.clear('defaultListIds')]);
  }

  logger.info('User is logged out');
  output('You are logged out.');
};

const command: Command = {
  command: 'logout',
  describe: 'Log out the authenticated user',
  handler,
};

export default command;
