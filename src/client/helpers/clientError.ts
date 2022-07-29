export enum ClientErrorCode {
  AuthorizationCodeMissing,
  CredentialsMissing,
  CredentialsInvalid,
  RefreshTokenInvalid,
  DataOfUnexpectedType,
}

type ClientErrorParameters = {
  message: string,
  url: string | undefined,
} & ({
  status: number
} | {
  code: ClientErrorCode
})

class ClientError extends Error {
  code?: ClientErrorCode;
  status?: number;
  url?: string;

  constructor(parameters: ClientErrorParameters) {
    super(parameters.message);

    this.status = 'status' in parameters ? parameters.status : undefined;
    this.code = 'code' in parameters ? parameters.code : undefined;
    this.url = parameters.url;
  }

  toString() {
    const description = `An error ocurred`;
    const url = this.url ? `at '${this.url}'` : null;
    const code = this.code ? `(code: ${this.code})` : null;
    const status = this.status ? `(status: ${this.status})` : null;
    const message = `- ${this.message}`;
    return [description, url, code, status, message].filter((arg) => !!arg).join(' ');
  }
}

export default ClientError;
