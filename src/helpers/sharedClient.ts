import Client from 'client/index'
import keychain from 'helpers/keychain';

const credentials = await keychain.getCredentials();

const sharedClient = new Client(credentials, async (newCredentials) => {
    if (newCredentials) {
      await keychain.setCredentials(newCredentials);
    } else {
      await keychain.clearCredentials();
    }
  }
);

export default sharedClient;
