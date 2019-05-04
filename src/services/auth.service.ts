import { inject, injectable } from 'inversify';
import * as jwt from 'jsonwebtoken';
import { ASYNC_INIT } from '../di/types';
import {
  assertRequiredScopes,
  getJwtBearerScopes,
  getJwtConfig,
  getTokenFromRequest,
  handleJwtError,
  IConfigTokenTypesDescriptor,
  IJwtConfig,
  IJwtPayload,
  isJwtPayload,
  jwtAudience,
} from '../utils/auth';
import { getDefaultKeyPaths, IKeys, loadKeys } from '../utils/key-pairs';
import { IUser, UserRole, UsersModel } from '../models/users.model';
import { IncomingMessage } from 'http';
import { JwtBearerScope } from '../utils/openapi';
import { ErrorCode, LogicError } from './error.service';
import { Nullable } from '../@types';

export interface IUserForToken {
  userId: number;
  role: UserRole;
}

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

  generateAccessToken(user: IUserForToken) {
    return jwt.sign({
      id: user.userId,
      scopes: getJwtBearerScopes(user),
    }, this._keys.accessToken.privateKey, {
      algorithm: 'RS256', // FIXME: RS256
      subject: user.userId.toString(),
      audience: jwtAudience,
      expiresIn: this._jwtConfig.expiration.accessToken,
      issuer: this._jwtConfig.issuer,
    });
  }

  generateRefreshToken(user: IUserForToken) {
    return jwt.sign({
      id: user.userId,
      scopes: [JwtBearerScope.TOKEN_REFRESH],
    }, this._keys.refreshToken.privateKey, {
      algorithm: 'RS512',
      subject: user.userId.toString(),
      audience: jwtAudience,
      expiresIn: this._jwtConfig.expiration.refreshToken,
      issuer: this._jwtConfig.issuer,
    });
  }

  decodeAccessToken(
    token: string,
    scopes: Nullable<JwtBearerScope[]> = null,
    ignoreExpiration = false,
  ) {
    let payload: object | string;
    try {
      payload = jwt.verify(token, this._keys.accessToken.publicKey, {
        ignoreExpiration,
        audience: jwtAudience,
        algorithms: ['RS256'],
        issuer: this._jwtConfig.issuer,
      });
    } catch (err) {
      handleJwtError(err);
    }
    if (!isJwtPayload(payload!)) {
      throw new LogicError(ErrorCode.AUTH_BAD_REFRESH);
    }
    if (scopes) {
      assertRequiredScopes(scopes, payload.scopes);
    }
    return payload;
  }

  decodeRefreshToken(
    token: string,
    checkScope = false,
    ignoreExpiration = false,
  ) {
    let payload: object | string;
    try {
      payload = jwt.verify(token, this._keys.accessToken.publicKey, {
        ignoreExpiration,
        audience: jwtAudience,
        algorithms: ['RS512'],
        issuer: this._jwtConfig.issuer,
      });
    } catch (err) {
      handleJwtError(err, ErrorCode.AUTH_BAD_REFRESH);
    }
    if (!isJwtPayload(payload!)) {
      throw new LogicError(ErrorCode.AUTH_BAD_REFRESH);
    }
    if (
      checkScope
      && (
        payload.scopes.length !== 1
        || payload.scopes[0] !== JwtBearerScope.TOKEN_REFRESH
      )
    ) {
      throw new LogicError(ErrorCode.AUTH_BAD_REFRESH);
    }
    return payload;
  }

  getUserFromRequestByAccessToken(
    request: IncomingMessage,
    scopes: Nullable<JwtBearerScope[]> = null,
    ignoreExpiration = false,
  ) {
    return this.getUserFromAccessToken(
      getTokenFromRequest(request),
      scopes,
      ignoreExpiration,
    );
  }

  async getUserFromAccessToken(
    token: string,
    scopes: Nullable<JwtBearerScope[]> = null,
    ignoreExpiration = false,
  ) {
    const payload = this.decodeAccessToken(
      token,
      scopes,
      ignoreExpiration,
    );
    return this.getUserFromPayload(payload);
  }

  async getUserFromPayload(
    payload: IJwtPayload,
  ) {
    const user = await this._usersModel.getOne({ userId: payload.id });
    if (!user) {
      throw new LogicError(ErrorCode.AUTH_BAD);
    }
    return user;
  }
}
