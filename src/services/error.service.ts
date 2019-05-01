import { OpenAPIRequestValidatorArgs } from 'openapi-request-validator';
import { OpenAPIResponseValidatorValidationError } from 'openapi-response-validator';
import { DeepReadonly } from '../@types';

export enum ErrorCode {
  AUTH_NO = 'AUTH_NO',
  AUTH_ROLE = 'AUTH_ROLE',
  AUTH_BAD = 'AUTH_BAD',
  AUTH_BAD_SCHEME = 'AUTH_BAD_SCHEME',
  AUTH_BAD_REFRESH = 'AUTH_BAD_SCHEME',
  AUTH_EXPIRED = 'AUTH_EXPIRED',

  USER_ROLE_BAD = 'USER_ROLE_BAD',
  USER_FILTER_BAD = 'USER_FILTER_BAD',
  USER_EMAIL_DUPLICATE = 'USER_EMAIL_DUPLICATE',
  // USER_ID_EMAIL = 'USER_EMAIL_AND_ID',
  USER_PASSWORD_NO = 'USER_PASSWORD_NO',
  USER_PASSWORD_SAVE_NO = 'USER_PASSWORD_SAVE_NO',

  SELECT_BAD = 'SELECT_BAD',
  SORT_BAD = 'SORT_BAD',

  OPENAPI = 'OPENAPI',

  SERVER = 'SERVER',
  NOT_FOUND = 'NOT_FOUND',
}

export class LogicError extends TypeError {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message?: string) {
    if (!message) {
      super(code);
    } else {
      super(message);
    }
    this.code = code;
  }
}

export class ResponseValidationError extends LogicError {
  public readonly validationError: DeepReadonly<
    Partial<OpenAPIResponseValidatorValidationError>
  >;
  public readonly message!: string;

  constructor(
    validationError: Partial<OpenAPIResponseValidatorValidationError>,
    message?: string,
  ) {
    super(ErrorCode.SERVER);
    Object.defineProperty(
      this,
      'message',
      {
        enumerable: true,
        configurable: false,
        writable: false,
        value: message,
      },
    );
    this.validationError = validationError;
  }
}

export const errorTransformer: OpenAPIRequestValidatorArgs['errorTransformer'] = (
  openApiError,
  ajvError,
) => {

};
