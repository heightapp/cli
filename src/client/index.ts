import auth from 'client/auth';
import ClientError, { ClientErrorCode } from 'client/helpers/clientError';

type ClientCredentials = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class Client {
  private _credentials: ClientCredentials | null;
  private onUpdatedCredentials: (credentials: ClientCredentials | null) => void

  private get credentials() {
    return this._credentials
  }

  private set credentials(credentials: ClientCredentials | null) {
    this._credentials = credentials;
    this.onUpdatedCredentials(this._credentials);
  }

  get auth() {
    return {
      ...auth,
      accessToken: {
        create: async (...args: Parameters<typeof auth['accessToken']['create']>) => {
          this.credentials = await auth.accessToken.create(...args);
          return this.credentials;
        },
        refresh: async () => {
          const refreshToken = this.credentials?.refreshToken;
          if (!refreshToken) {
            throw new ClientError({message: 'You are not logged in.', code: ClientErrorCode.CredentialsMissing, url: 'refresh'});
          }

          this.credentials = await auth.accessToken.refresh({refreshToken});
          return this.credentials;
        },
        revoke: async () => {
          const accessToken = this.credentials?.accessToken;
          if (!accessToken) {
            throw new ClientError({message: 'You are already logged out.', code: ClientErrorCode.CredentialsMissing, url: 'revoke'});
          }

          await auth.accessToken.revoke({accessToken});
          this.credentials = null;
        },
      },
    }
  }

  constructor(credentials: ClientCredentials | null, onUpdatedCredentials: (credentials: ClientCredentials | null) => void) {
    this._credentials = credentials;
    this.onUpdatedCredentials = onUpdatedCredentials;
  }
}

export default Client;
