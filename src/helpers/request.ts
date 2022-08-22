import nodeFetch from 'node-fetch';
import logger from './logger';

type Init = Parameters<typeof nodeFetch>[0];
type Options = Omit<Exclude<Parameters<typeof nodeFetch>[1], undefined>, 'body'> & {
  body?: object
};

const request = async (init: Init, options?: Options) => {
  const method = options?.method ?? 'GET';

  // TODO: remove query from url to log
  const url = typeof init === 'string' ? init : init.url;
  const pathname = (() => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.pathname;
    } catch {
      return url;
    }
  })();

  // Log request start
  logger.info(`Start ${method} ${pathname} request`);

  // Execute request
  const response = await nodeFetch(init, {
    ...options,
    headers: {
      ...options?.headers,
      'Content-Type': 'application/json',
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  // Log request finished
  if (response.status >= 200 && response.status < 300) {
    logger.info(`Successful ${method} ${pathname} request`, {  
      status: response.status
    });
  } else {
    logger.error(`Failed ${method} ${pathname} request`, {  
      status: response.status
    });
  }

  return response;
}

export default request;