export enum ClientErrorCode {
  AuthorizationCodeMissing,
  CredentialsMissing,
  RefreshTokenInvalid,
}

type ClientErrorParameters = {
  message: string,
  url: string,
} & ({
  status: number
} | {
  code: ClientErrorCode
})

class ClientError extends Error {
  code?: ClientErrorCode;
  status?: number;
  url: string;

  constructor(parameters: ClientErrorParameters) {
    super(parameters.message);

    this.status = 'status' in parameters ? parameters.status : undefined;
    this.code = 'code' in parameters ? parameters.code : undefined;
    this.url = parameters.url;
  }
}

export default ClientError;
