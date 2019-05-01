import { Nullable } from '../@types';
import { getContainer } from '../di/container';
import { AuthService } from './auth.service';
import { SecurityHandlers } from 'openapi-security-handler';
import { OpenAPIV3 } from 'openapi-types';
import { logger } from './logger.service';

export const jwtBearerScheme = 'jwt-bearer';

export enum JwtBearerScope {
  USER = 'user',
  ADMIN = 'admin',
  TOKEN_REFRESH = 'token:refresh',
}

let auth: Nullable<AuthService> = null;
let securityHandlers: Nullable<SecurityHandlers> = null;
export function getSecurityHandlers() {
  if (!auth) {
    auth = getContainer().get<AuthService>(AuthService);
  }
  if (!securityHandlers) {
    securityHandlers = {
      'jwt-bearer': async (req, scopes, definition) => {
        const scheme = definition as unknown as OpenAPIV3.OAuth2SecurityScheme;
        logger.debug(scheme);
        logger.debug(req);
        logger.debug(scopes);
        return false;
      },
    };
  }
  return securityHandlers;
}
