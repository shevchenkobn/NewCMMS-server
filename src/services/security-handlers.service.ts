import { Nullable } from '../@types';
import { getContainer } from '../di/container';
import { AuthService } from './auth.service';
import { SecurityHandlers } from 'openapi-security-handler';

let auth: Nullable<AuthService> = null;
let securityHandlers: Nullable<SecurityHandlers> = null;
export function getSecurityHandlers() {
  if (!auth) {
    auth = getContainer().get<AuthService>(AuthService);
  }
  if (!securityHandlers) {
    securityHandlers = {
      'jwt-bearer': (req, scopes, definition) => {
        return true;
      },
    };
  }
  return securityHandlers;
}
