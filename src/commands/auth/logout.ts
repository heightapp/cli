import config from 'helpers/config';
import keychain from 'helpers/keychain';
import logger from 'helpers/logger';
import output from 'helpers/output';
import sharedClient from 'helpers/sharedClient';

const logout = async () => {
  const existingCredentials = await keychain.getCredentials();
  if (!existingCredentials) {
    logger.info('Tried to log out but is not logged in');
    output('You are not logged in.');
    return;
  }

  // Revoke automatically clears the credentials through sharedClient, so no need to clear here
  await sharedClient.auth.accessToken.revoke();
  await config.clear('user');
  logger.info('User is logged out');
  output('You are logged out.');
};

export default logout;
