import config from 'config';
import output from 'output';
import sharedClient from 'sharedClient';

const logout = async () => {
  const existingCredentials = await config.get('credentials');
  if (!existingCredentials) {
    output('You are not logged in.');
    return;
  }

  // Revoke automatically clears the credentials through sharedClient, so no need to clear here
  await sharedClient.auth.accessToken.revoke();
  await config.clear('user');
  output('You are logged out.');
};

export default logout;
