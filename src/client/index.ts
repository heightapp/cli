import auth from 'client/auth';
import user from 'client/user';
import ClientError, { ClientErrorCode } from 'client/helpers/clientError';
import env from 'env';
import fetch from 'node-fetch';

const EXPIRY_OFFSET = 2 * 60 * 1000; // 2 mins - to account for any request/other delay and be safe

type ClientCredentials = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
class Client {
  private _credentials: ClientCredentials | null;
  private onUpdatedCredentials?: (credentials: ClientCredentials | null) => void

  private get credentials() {
    return this._credentials
  }

  private set credentials(credentials: ClientCredentials | null) {
    this._credentials = credentials;
    this.onUpdatedCredentials?.(this._credentials);
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
            throw new ClientError({message: 'You are not logged in.', code: ClientErrorCode.CredentialsMissing, url: undefined});
          }

          this.credentials = await auth.accessToken.refresh({refreshToken});
          return this.credentials;
        },
        revoke: async () => {
          const accessToken = this.credentials?.accessToken;
          if (!accessToken) {
            throw new ClientError({message: 'You are already logged out.', code: ClientErrorCode.CredentialsMissing, url: undefined});
          }

          await auth.accessToken.revoke({accessToken});
          this.credentials = null;
        },
      },
    }
  }

  get user() {
    return {
      get: user.get(this),
    }
  }

  constructor(credentials: ClientCredentials | null, onUpdatedCredentials?: (credentials: ClientCredentials | null) => void) {
    this._credentials = credentials;
    this.onUpdatedCredentials = onUpdatedCredentials;
  }

  request = async <Data extends object>(path: string, options?: Parameters<typeof fetch>[1]) => {
    // If token is expired, refresh
    if (this.credentials && this.credentials.expiresAt < Date.now() + EXPIRY_OFFSET) {
      await this.auth.accessToken.refresh();
    }

    const url = (() => {
      const url = new URL(env.apiHost);
      url.pathname = path;
      return url.href;
    })();

    if (!this.credentials) {
      throw new ClientError({message: 'You are not logged in.', code: ClientErrorCode.CredentialsMissing, url});
    }

    // Execute request
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.credentials.accessToken}`,
      },
    });

    if (response.status === 401) {
      this.credentials = null;
      throw new ClientError({message: 'Invalid credentials. Please reauthenticated.', code: ClientErrorCode.CredentialsInvalid, url});
    }

    let data: any;
    try {
      data = await response.json();
    } catch (e) {
      // Ignore for now, we'll handle it later
    }

    if (response.status >= 200 && response.status < 300) {
      if (!data) {
        throw new ClientError({message: 'Something weird happened. Please try again.', code: ClientErrorCode.DataOfUnexpectedType, url});
      }

      return {
        response,
        data: data as Data, // Optimistically accept the data that has been returned
      };
    }

    throw new ClientError({message: data?.error?.message ?? 'Something weird happened. Please try again.', status: response.status, url});
  }
}

export default Client;
