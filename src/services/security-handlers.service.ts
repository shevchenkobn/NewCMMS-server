import { ErrorRequestHandler, Request } from 'express';
import { SecurityHandlers } from 'openapi-security-handler';
import { OpenAPIV3 } from 'openapi-types';
import { DeepReadonly, Nullable } from '../@types';
import { getContainer } from '../di/container';
import { IUser } from '../models/users.model';
import {
  assertRequiredScopes,
  getTokenFromRequest,
  IJwtPayload,
} from '../utils/auth';
import {
  IOpenApiRequest,
  isOpenApiSecurityHandlerError,
  JwtBearerScope,
} from '../utils/openapi';
import { AuthService } from './auth.service';
import { LogicError } from './error.service';

export interface IRequestWithUser extends IOpenApiRequest {
  user: IUser;
}

export interface IRequestWithToken extends IRequestWithUser {
  tokenPayload?: IJwtPayload;
}

export interface IRequestWithAuthError extends IRequestWithToken {
  authError: LogicError;
}

let authService: AuthService; // not Nullable<> due to type inference flaw
let securityHandlers: Nullable<SecurityHandlers> = null;
export function getSecurityHandlers(): Readonly<SecurityHandlers> {
  if (!securityHandlers) {
    if (!authService) {
      authService = getContainer().get<AuthService>(AuthService);
    }
    securityHandlers = {
      'jwt-bearer': async (req, scopes, definition) => {
        const scheme = definition as unknown as OpenAPIV3.OAuth2SecurityScheme;
        const request = req as IRequestWithAuthError;
        const jwtScopes = scopes as JwtBearerScope[];

        // This is necessary due to peculiarities of error handling by openapi-security-handler: https://github.com/kogosoftwarellc/open-api/blob/db977d3ca6adbaa08c44e0db1231c74c8427eaba/packages/openapi-security-handler/index.ts
        try {
          if (!request.tokenPayload) {
            request.tokenPayload = authService.getAccessTokenPayload(
              getTokenFromRequest(request),
              jwtScopes,
            );
          } else {
            assertRequiredScopes(jwtScopes, request.tokenPayload.scopes);
          }
          if (!request.user) {
            const user = await authService.getUserFromPayload(
              request.tokenPayload,
            );
            request.user = user;
          }
        } catch (err) {
          request.authError = err;
          return false;
        }
        return true;
      },
    };
  }
  return securityHandlers;
}

export const openApiSecurityHandlerTransfomMiddleware: ErrorRequestHandler = (
  err,
  req,
  res,
  next,
) => {
  next(transformOpenApiSecurityHandlerError(err, req));
};

export const transformOpenApiSecurityHandlerError = (
  err: any,
  req: Request,
) => {
  const request = req as IRequestWithAuthError;
  delete request.tokenPayload;
  if (request.authError && isOpenApiSecurityHandlerError(err)) {
    return request.authError;
  }
  return err;
};
