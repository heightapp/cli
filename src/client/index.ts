import auth from 'client/auth';
import ClientError, {ClientErrorCode} from 'client/helpers/clientError';
import task from 'client/task';
import user from 'client/user';
import userPreference from 'client/userPreference';
import view from 'client/view';
import env from 'env';
import logger from 'helpers/logger';
import request from 'helpers/request';
import {Response} from 'node-fetch';

const EXPIRY_OFFSET = 2 * 60 * 1000; // 2 mins - to account for any request/other delay and be safe

type ClientCredentials = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
class Client {
  private privateCredentials: ClientCredentials | null;
  private onUpdatedCredentials?: (credentials: ClientCredentials | null) => void;

  private get credentials() {
    return this.privateCredentials;
  }

  private set credentials(credentials: ClientCredentials | null) {
    logger.info('Init client', {
      loggedIn: !!credentials,
    });

    this.privateCredentials = credentials;
    this.onUpdatedCredentials?.(this.privateCredentials);
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
          const refreshToken = this.credentials?.refreshToken;
          if (!refreshToken) {
            throw new ClientError({message: 'You are already logged out.', code: ClientErrorCode.CredentialsMissing, url: undefined});
          }

          await auth.accessToken.revoke({refreshToken});
          this.credentials = null;
        },
      },
    };
  }

  get user() {
    return {
      get: user.get(this),
    };
  }

  get userPreference() {
    return {
      get: userPreference.get(this),
    };
  }

  get task() {
    return {
      create: task.create(this),
    };
  }

  get view() {
    return {
      getDefault: view.getDefault(this),
    };
  }

  constructor(credentials: ClientCredentials | null, onUpdatedCredentials?: (credentials: ClientCredentials | null) => void) {
    this.privateCredentials = credentials;
    this.onUpdatedCredentials = onUpdatedCredentials;
  }

  request = async <Data extends object>(path: string, options?: Parameters<typeof request>[1]): Promise<{response: Response, data: Data}> => {
    // If token is expired, refresh
    if (this.credentials && this.credentials.expiresAt < Date.now() + EXPIRY_OFFSET) {
      await this.auth.accessToken.refresh();
    }

    const url = (() => {
      const u = new URL(env.apiHost);
      u.pathname = path;
      return u.href;
    })();

    if (!this.credentials) {
      throw new ClientError({message: 'You are not logged in.', code: ClientErrorCode.CredentialsMissing, url});
    }

    const response = await request(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.credentials.accessToken}`,
      },
    });

    let data: any;
    try {
      data = await response.json();
    } catch (e) {
      // Ignore for now, we'll handle it later
    }

    if (response.status === 401) {
      if (data?.error?.type === 'authtokenexpired') {
        // Refresh token
        await this.auth.accessToken.refresh();
        return this.request<Data>(path, options);
      }

      // Clear credentials
      this.credentials = null;
      throw new ClientError({message: 'Invalid credentials. Please reauthenticate.', code: ClientErrorCode.CredentialsInvalid, url});
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
  };
}

export default Client;
