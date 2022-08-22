import Client from 'client/index'
import keychain from 'helpers/keychain';

const credentials = await keychain.getCredentials();

const sharedClient = new Client(credentials, async (newCredentials) => {
  if (newCredentials) {
    const existingCredentials = await keychain.getCredentials();
    if (existingCredentials?.user) {
      await keychain.setCredentials({...newCredentials, user: existingCredentials.user});
    } else {
      await keychain.clearCredentials();  
    }
  } else {
    await keychain.clearCredentials();
  }
});

export default sharedClient;
