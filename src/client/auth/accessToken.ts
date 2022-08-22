import env from 'env'
import ClientError, { ClientErrorCode } from 'client/helpers/clientError';
import log from 'helpers/logger';
import request from 'helpers/request';

const validateCreateOrRefreshData = (data: any): data is {access_token: string, refresh_token: string, expires_at: string} => {
  return (
    !!data.access_token && typeof data.access_token === 'string' &&
    !!data.refresh_token && typeof data.refresh_token === 'string' &&
    !!data.expires_at && typeof data.expires_at === 'string'
  )
}

const create = async ({code, codeVerifier}: {code: string; codeVerifier: string}) => {
  const url = new URL(env.apiHost);
  url.pathname = 'oauth/tokens';

  const response = await request(url.href, {
    method: 'POST',
    body: {
      code,
      client_id: env.oauthClientId,
      redirect_uri: env.oauthRedirectUrl,
      grant_type: 'authorization_code',
      scope: env.oauthScopes,
      code_verifier: codeVerifier,
    },
  });

  log.info('Finished access token request', {
    url: url.href,
    status: response.status,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new ClientError({
      status: response.status,
      url: url.href,
      message: response.statusText
    });
  }

  const data = (await response.json());
  if (!validateCreateOrRefreshData(data)) {
    throw new ClientError({
      status: 400,
      url: url.href,
      message: 'Invalid payload'
    });
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at).getTime(),
  };
};

const refresh = async ({refreshToken}: {refreshToken: string}) => {
  const url = new URL(env.apiHost);
  url.pathname = 'oauth/tokens';

  log.info('Start access token refresh', {
    url: url.href,
  });

  const response = await request(url.href, {
    method: 'POST',
    body: {
      client_id: env.oauthClientId,
      redirect_uri: env.oauthRedirectUrl,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: env.oauthScopes,
    },
  });

  log.info('Finished access token refresh', {
    url: url.href,
    status: response.status,
  });

  if (response.status >= 400 && response.status < 500) {
    throw new ClientError({
      code: ClientErrorCode.RefreshTokenInvalid,
      url: url.href,
      message: 'Invalid payload',
    });
  }

  if (response.status < 200 || response.status >= 300) {
    throw new ClientError({
      status: response.status,
      url: url.href,
      message: response.statusText,
    });
  }

  const data = (await response.json());
  if (!validateCreateOrRefreshData(data)) {
    throw new ClientError({
      status: 400,
      url: url.href,
      message: 'Invalid payload'
    });
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at).getTime(),
  };
};

const revoke = async ({refreshToken}: {refreshToken: string}) => {
  const url = new URL(env.apiHost);
  url.pathname = `oauth/tokens/revoke`;

  const response = await request(url.href, {
    method: 'POST',
    body: {
      token: refreshToken,
      token_type_hint: 'refresh_token',
    },
  });

  if (response.status < 200 || response.status >= 300) {
    throw new ClientError({
      status: response.status,
      url: url.href,
      message: response.statusText,
    });
  }
}

export default {
  create,
  refresh,
  revoke,
}
