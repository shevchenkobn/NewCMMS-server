import { inject, injectable } from 'inversify';
import * as jwt from 'jsonwebtoken';
import { ASYNC_INIT } from '../di/types';
import {
  getJwtConfig, getTokenFromRequest, getTokenFromAccessTokenString,
  IConfigTokenTypesDescriptor,
  IJwtConfig, getJwtBearerScopes,
} from '../utils/auth';
import {
  getDefaultKeyPaths,
  IKeys,
  loadKeys,
} from '../utils/key-pairs';
import { IUser, UsersModel } from '../models/users.model';
import { IncomingMessage } from 'http';
import { JwtBearerScope } from '../utils/openapi';
import { ErrorCode, LogicError } from './error.service';

export interface IJwtPayload {
  id: number;
  scopes: JwtBearerScope[];
}

export const jwtAudience = 'human-actors';

@injectable()
export class AuthService {
  public static readonly [ASYNC_INIT] = true;
  public readonly [ASYNC_INIT]: Promise<void>;
  private _jwtConfig: Pick<IJwtConfig, 'expiration' | 'issuer'>;
  private _keys!: IConfigTokenTypesDescriptor<IKeys>;
  private _usersModel: UsersModel;

  constructor(
    @inject(UsersModel) usersModel: UsersModel,
    keyPaths = getDefaultKeyPaths(),
  ) {
    this._jwtConfig = getJwtConfig();
    this[ASYNC_INIT] = loadKeys(keyPaths, false).then(keys => {
      this._keys = keys;
    });
    this._usersModel = usersModel;
  }

  generateAccessToken(user: IUser) {
    return jwt.sign({
      id: user.userId,
      scopes: getJwtBearerScopes(user),
    }, this._keys.accessToken.privateKey, {
      algorithm: 'RS512', // FIXME: RS256
      expiresIn: this._jwtConfig.expiration.accessToken,
      issuer: this._jwtConfig.issuer,
    });
  }

  generateRefreshToken(user: IUser) {
    return jwt.sign({
      id: user.userId,
      scopes: [JwtBearerScope.TOKEN_REFRESH],
    }, this._keys.refreshToken.privateKey, {
      algorithm: 'RS512',
      audience: jwtAudience,
      expiresIn: this._jwtConfig.expiration.refreshToken,
      issuer: this._jwtConfig.issuer,
    });
  }

  decodeAccessToken(token: string, ignoreExpiration = false) {
    return jwt.verify(token, this._keys.accessToken.publicKey, {
      ignoreExpiration,
      audience: jwtAudience,
      algorithms: ['RS512'], // FIXME: RS256
      issuer: this._jwtConfig.issuer,
    }) as IJwtPayload;
  }

  decodeRefreshToken(token: string, ignoreExpiration = false) {
    return jwt.verify(token, this._keys.accessToken.publicKey, {
      ignoreExpiration,
      algorithms: ['RS512'],
      issuer: this._jwtConfig.issuer,
    }) as IJwtPayload;
  }

  getUserFromRequestByAccessToken(
    request: IncomingMessage,
    ignoreExpiration = false,
  ) {
    return this.getUserFromAccessToken(
      getTokenFromRequest(request),
      ignoreExpiration,
    );
  }

  async getUserFromAccessToken(token: string, ignoreExpiration = false) {
    const { id: userId } = this.decodeAccessToken(token, ignoreExpiration);
    const users = await this._usersModel.table.where({ userId }).select(); // FIXME: add method for retrieving
    if (users.length === 0) {
      throw new LogicError(ErrorCode.AUTH_BAD);
    }
    return users[0] as IUser;
  }
}
