import ClientError from 'client/helpers/clientError';
import env from 'env';
import request from 'helpers/request';

const validateGetData = (data: any): data is {readKey: string, writeKey: string} => {
  return (
    data.readKey && typeof data.readKey === 'string' &&
    data.writeKey && typeof data.writeKey === 'string'
  );
};

const get = async () => {
  const url = new URL(env.apiHost);
  url.pathname = 'integrations/getKeys';

  const response = await request(url.href, {
    method: 'GET',
  });

  if (response.status < 200 || response.status >= 300) {
    throw new ClientError({
      status: response.status,
      url: url.href,
      message: response.statusText,
    });
  }

  const data = await response.json();
  if (!validateGetData(data)) {
    throw new ClientError({
      status: 400,
      url: url.href,
      message: 'Invalid payload',
    });
  }

  return {
    readKey: data.readKey,
    writeKey: data.writeKey,
  };
};

export default {
  get,
};
