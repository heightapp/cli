import ClientError, { ClientErrorCode } from 'client/helpers/clientError';
import env from 'env';
import fetch from 'node-fetch';

const validateGetData = (data: any): data is {code: string} => {
  return (
    data.code && typeof data.code === 'string'
  );
}

const get = async ({readKey}: {readKey: string}): Promise<{code: string}> => {
  const url = new URL(env.apiHost);
  url.pathname = 'integrations/getCode';
  url.searchParams.set('readKey', readKey);

  const response = await fetch(url.href, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status < 200 || response.status >= 300) {
    throw new ClientError({
      status: response.status,
      url: url.href,
      message: response.statusText
    });
  }

  const text = await response.text();
  if (!text) {
    // 200 does not mean the code is set for the key yet
    // So we check if we actually received a code or not
    throw new ClientError({
      code: ClientErrorCode.AuthorizationCodeMissing,
      url: url.href,
      message: response.statusText
    });
  }

  const data = JSON.parse(text);
  if (!validateGetData(data)) {
    throw new ClientError({
      status: 400,
      url: url.href,
      message: 'Invalid payload',
    });
  }

  return {
    code: data.code
  };
};

export default {
  get,
}
