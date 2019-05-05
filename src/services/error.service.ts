import { OpenAPIRequestValidatorArgs, OpenAPIRequestValidatorError } from 'openapi-request-validator';
import { OpenAPIResponseValidatorValidationError } from 'openapi-response-validator';
import { DeepReadonly, Nullable } from '../@types';
import * as Ajv from 'ajv';
import { IOpenApiFinalError } from '../utils/openapi';

export enum ErrorCode {
  AUTH_NO = 'AUTH_NO',
  AUTH_ROLE = 'AUTH_ROLE',
  AUTH_BAD = 'AUTH_BAD',
  AUTH_BAD_SCHEME = 'AUTH_BAD_SCHEME',
  AUTH_BAD_REFRESH = 'AUTH_BAD_REFRESH',
  AUTH_EXPIRED = 'AUTH_EXPIRED',

  USER_ROLE_BAD = 'USER_ROLE_BAD',
  USER_FILTER_BAD = 'USER_FILTER_BAD',
  USER_CREDENTIALS_BAD = 'USER_CREDENTIALS_BAD',
  USER_EMAIL_DUPLICATE = 'USER_EMAIL_DUPLICATE',
  USER_EMAIL_AND_ID = 'USER_EMAIL_AND_ID',
  USER_PASSWORD_NO = 'USER_PASSWORD_NO',
  USER_PASSWORD_SAVE_NO = 'USER_PASSWORD_SAVE_NO',
  USER_PASSWORD_PROVIDED = 'USER_PASSWORD_PROVIDED',

  SELECT_BAD = 'SELECT_BAD',
  SORT_BAD = 'SORT_BAD',

  OPENAPI_VALIDATION = 'OPENAPI_VALIDATION',

  SERVER = 'SERVER',
  SERVER_OPENAPI_RESPONSE_VALIDATION = 'SERVER_OPENAPI_RESPONSE_VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
}

export type ServerErrorCode =
  ErrorCode.SERVER
  | ErrorCode.SERVER_OPENAPI_RESPONSE_VALIDATION;

export interface ILogicError {
  code: ErrorCode;
}

export interface IOpenApiFinalLogicError extends ILogicError, IOpenApiFinalError {
}

export class LogicError extends TypeError implements ILogicError {
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

export class OpenApiValidationError extends Error {
  readonly openApiError: DeepReadonly<OpenAPIRequestValidatorError>;
  readonly jsonSchemaError: DeepReadonly<Ajv.ErrorObject>;

  constructor(
    openApiError: DeepReadonly<OpenAPIRequestValidatorError>,
    jsonSchemaError: DeepReadonly<Ajv.ErrorObject>,
    message?: string,
  ) {
    super(message);
    this.openApiError = openApiError;
    this.jsonSchemaError = jsonSchemaError;
  }
}

export class ServerError extends LogicError {
  readonly innerError?: DeepReadonly<any>;

  constructor(
    code: ServerErrorCode,
    innerError?: DeepReadonly<any>,
    message?: string,
  ) {
    super(code);
    this.innerError = innerError;
    if (message) {
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
    }
  }
}

export class ResponseValidationError extends ServerError {
  readonly innerError!: DeepReadonly<
    Partial<OpenAPIResponseValidatorValidationError>
  >;

  constructor(
    validationError: DeepReadonly<
      Partial<OpenAPIResponseValidatorValidationError>
    >,
    message?: string,
  ) {
    super(
      ErrorCode.SERVER_OPENAPI_RESPONSE_VALIDATION,
      validationError,
      message,
    );
  }
}

export const errorTransformer: OpenAPIRequestValidatorArgs['errorTransformer'] = (
  openApiError,
  ajvError,
) => {
  return new OpenApiValidationError(openApiError, ajvError);
};

export function coerceLogicError(
  err: DeepReadonly<IOpenApiFinalError>,
): IOpenApiFinalLogicError {
  const error = err as IOpenApiFinalLogicError;
  error.code = ErrorCode.OPENAPI_VALIDATION;
  return error;
}
