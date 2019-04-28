import { IConfigKeyPairDescriptor } from './key-pairs';
import {
  DeepNullablePartial,
  DeepReadonly,
  Nullable,
  Optional,
} from '../@types';
import * as config from 'config';
import { ErrorCode, LogicError } from '../services/error.service';
import { IncomingMessage } from 'http';

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
    jwtConfig = config.get<IJwtConfig>('jwt');
  }
  return jwtConfig;
}

export function getTokenFromRequest(request: IncomingMessage) {
  if (typeof request.headers.authorization !== 'string') {
    throw new LogicError(ErrorCode.AUTH_NO);
  }
  return getTokenFromString(request.headers.authorization);
}

const bearerRegex = /^Bearer +/;
export function getTokenFromString(str: string) {
  if (!bearerRegex.test(str)) {
    throw new LogicError(ErrorCode.AUTH_BAD_SCHEME);
  }
  return str.replace(bearerRegex, '');
}
