import * as config from 'config';
import { IncomingMessage } from 'http';
import { DeepNullablePartial, DeepReadonly, Nullable } from '../@types';
import { IUser, UserRole } from '../models/users.model';
import { ErrorCode, LogicError } from '../services/error.service';
import { IConfigKeyPairDescriptor } from './key-pairs';
import { JwtBearerScope, jwtScopeStrings } from './openapi';
import { TokenExpiredError, VerifyErrors } from 'jsonwebtoken';

export interface IConfigTokenTypesDescriptor<T> {
  accessToken: T;
  refreshToken: T;
}

export interface IJwtConfig {
  expiration: IConfigTokenTypesDescriptor<number>;
  algorithms: IConfigTokenTypesDescriptor<string>;
  issuer: string;
  keys: {
    folder: string;
    filenames: IConfigTokenTypesDescriptor<IConfigKeyPairDescriptor>;
    keyStrings?: DeepNullablePartial<
      IConfigTokenTypesDescriptor<IConfigKeyPairDescriptor>
    >;
  };
}

export interface IJwtPayload {
  id: number;
  scopes: JwtBearerScope[];
}

export const jwtAudience = 'human-actors';

let jwtConfig: Nullable<DeepReadonly<IJwtConfig>> = null;
export function getJwtConfig() { // use it to cache wherever needed
  if (!jwtConfig) {
    jwtConfig = config.get<IJwtConfig>('auth.jwt');
  }
  return jwtConfig;
}

export function isJwtPayload(payload: any): payload is IJwtPayload {
  return typeof payload === 'object' && payload !== null
    && typeof payload.id === 'number'
    && Array.isArray(payload.scopes)
    && payload.scopes.every((p: string) => jwtScopeStrings.includes(p));
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

export function getJwtBearerScopes(user: { role: UserRole }) {
  const scopes = [];
  if (user.role & UserRole.EMPLOYEE) {
    scopes.push(JwtBearerScope.EMPLOYEE);
  }
  if (user.role & UserRole.ADMIN) {
    scopes.push(JwtBearerScope.ADMIN);
  }
  return scopes;
}

export function handleJwtError(
  err: VerifyErrors,
  codeToThrow = ErrorCode.AUTH_BAD,
): never {
  if (err instanceof TokenExpiredError) {
    throw new LogicError(ErrorCode.AUTH_EXPIRED);
  }
  throw new LogicError(codeToThrow);
}

export function assertRequiredScopes(
  requiredScopes: ReadonlyArray<JwtBearerScope>,
  actualScopes: ReadonlyArray<JwtBearerScope>,
) {
  if (actualScopes.some(s => !requiredScopes.includes(s))) {
    // Scope is synonymic to user's role
    throw new LogicError(ErrorCode.AUTH_ROLE);
  }
}

export function getAlgorithmVariants() {
  return /^[PR]S(256|384|512)$/;
}

export function isValidAlgorithm(algo: string): boolean {
  return getAlgorithmVariants().test(algo);
}
