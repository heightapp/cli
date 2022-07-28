import env from 'env';
import pkceChallenge from 'pkce-challenge';
import open from 'open';
import ClientError, { ClientErrorCode } from 'client/helpers/clientError';
import sharedClient from 'sharedClient';
import output from 'output';

const GET_AUTHORIZATION_CODE_INTERVAL = 3000;

// Try to get auth code every `GET_AUTHORIZATION_CODE_INTERVAL` interval
const getAuthorizationCode = async (readKey: string) => {
  return new Promise<string>((resolve) => {
    setTimeout(async () => {
      try {
        const {code} = await sharedClient.auth.authorizationCode.get({readKey})
        resolve(code);
      } catch (e) {
        if (e instanceof ClientError && e.code === ClientErrorCode.AuthorizationCodeMissing) {
          // Retry
          resolve(getAuthorizationCode(readKey));
        } else {
          throw e
        }
      }
    }, GET_AUTHORIZATION_CODE_INTERVAL)
  })
}

const login = async () => {
  const {readKey, writeKey} = await sharedClient.auth.authorizationCodeKeys.get();
  const {code_verifier, code_challenge} = ((pkceChallenge as any).default as typeof pkceChallenge)(); // pkce-challenge is a commonjs module

  // Open oauth
  const url = new URL(env.webHost);
  url.pathname = 'oauth/authorization';
  url.searchParams.set('client_id', env.oauthClientId);
  url.searchParams.set('redirect_uri', env.oauthRedirectUrl);
  url.searchParams.set('scope', `[${env.oauthScopes}]`);
  url.searchParams.set(
    'state',
    JSON.stringify({
      writeKey,
      description: 'Please return to the CLI',
    }),
  );
  url.searchParams.set('code_challenge', code_challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  open(url.href);

  // Wait for the code to be available
  const code = await getAuthorizationCode(readKey)

  // Create tokens
  await sharedClient.auth.accessToken.create({code, codeVerifier: code_verifier});

  output('You are logged in.');
};

export default login;
