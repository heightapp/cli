import ClientError from 'client/helpers/clientError';
import output from 'output';
import sharedClient from 'sharedClient';

const logout = async () => {
  try {
    await sharedClient.auth.accessToken.revoke();
    output('You are logged out.');
  } catch (e: any) {
    output(e?.message ?? 'Something weird happened. Please try again.');
  }
};

export default logout;
