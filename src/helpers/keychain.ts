import keytar from 'keytar';

type Credentials = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const ACCOUNT = 'height';
const SERVICE = 'height-cli';

const getCredentials = async() => {
  const json = await keytar.getPassword(SERVICE, ACCOUNT)
  if (!json) {
    return null;
  }

  try {
    const credentials = JSON.parse(json);
    if (typeof credentials.accessToken !== 'string' || typeof credentials.refreshToken !== 'string' || typeof credentials.expiresAt !== 'number') {
      return null;
    }
    return credentials as Credentials;
  } catch {
    // Ignore
    return null;
  }
};

const setCredentials = async(value: Credentials) => {
  try {
    const json = JSON.stringify(value);
    return keytar.setPassword(SERVICE, ACCOUNT, json)
  } catch {
    // Ignore
  }

};

const clearCredentials = async() => {
  return keytar.deletePassword(SERVICE, ACCOUNT)
};

export default {
  getCredentials,
  setCredentials,
  clearCredentials,
};
