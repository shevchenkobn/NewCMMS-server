import { Request } from 'express';
import { SecurityHandlers } from 'openapi-security-handler';
import { OpenAPIV3 } from 'openapi-types';
import { Nullable } from '../@types';
import { getContainer } from '../di/container';
import { IUser } from '../models/users.model';
import { JwtBearerScope } from '../utils/openapi';
import { AuthService } from './auth.service';

export interface IRequestWithUser extends Request {
  user: IUser;
}

let authService: AuthService; // not Nullable<> due to type inference flaw
let securityHandlers: Nullable<SecurityHandlers> = null;
export function getSecurityHandlers() {
  if (!securityHandlers) {
    if (!authService) {
      authService = getContainer().get<AuthService>(AuthService);
    }
    securityHandlers = {
      'jwt-bearer': async (req, scopes, definition) => {
        const scheme = definition as unknown as OpenAPIV3.OAuth2SecurityScheme;
        const request = req as IRequestWithUser;
        const jwtScopes = scopes as JwtBearerScope[];

        const user = await authService.getUserFromRequestByAccessToken(request);
        request.user = user;
        return true;
      },
    };
  }
  return securityHandlers;
}
