import * as config from 'config';
import { IncomingMessage } from 'http';
import { DeepNullablePartial, DeepReadonly, Nullable } from '../@types';
import { IUser, UserRole } from '../models/users.model';
import { ErrorCode, LogicError } from '../services/error.service';
import { IConfigKeyPairDescriptor } from './key-pairs';
import { JwtBearerScope } from './openapi';

export interface IConfigTokenTypesDescriptor<T> {
  accessToken: T;
  refreshToken: T;
}

export interface IJwtConfig {
  expiration: IConfigTokenTypesDescriptor<number>;
  issuer: string;
  keys: {
    folder: string;
    filenames: IConfigTokenTypesDescriptor<IConfigKeyPairDescriptor>;
    keyStrings?: DeepNullablePartial<
      IConfigTokenTypesDescriptor<IConfigKeyPairDescriptor>
    >;
  };
}

let jwtConfig: Nullable<DeepReadonly<IJwtConfig>> = null;
export function getJwtConfig() { // use it to cache wherever needed
  if (!jwtConfig) {
    jwtConfig = config.get<IJwtConfig>('auth.jwt');
  }
  return jwtConfig;
}

export function getTokenFromRequest(request: IncomingMessage) {
  if (typeof request.headers.authorization !== 'string') {
    throw new LogicError(ErrorCode.AUTH_NO);
  }
  return getTokenFromAccessTokenString(request.headers.authorization);
}

const bearerRegex = /^Bearer +/;
export function getTokenFromAccessTokenString(str: string) {
  if (!bearerRegex.test(str)) {
    throw new LogicError(ErrorCode.AUTH_BAD_SCHEME);
  }
  return str.replace(bearerRegex, '');
}

export function getJwtBearerScopes(user: IUser) {
  const scopes = [];
  if (user.role & UserRole.EMPLOYEE) {
    scopes.push(JwtBearerScope.EMPLOYEE);
  }
  if (user.role & UserRole.ADMIN) {
    scopes.push(JwtBearerScope.ADMIN);
  }
  return scopes;
}
