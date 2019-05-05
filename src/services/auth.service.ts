import { inject, injectable } from 'inversify';
import * as jwt from 'jsonwebtoken';
import { ASYNC_INIT } from '../di/types';
import {
  assertRequiredScopes, getAlgorithmVariants,
  getJwtBearerScopes,
  getJwtConfig,
  getTokenFromRequest,
  handleJwtError,
  IConfigTokenTypesDescriptor,
  IJwtConfig,
  IJwtPayload,
  isJwtPayload, isValidAlgorithm,
  jwtAudience,
} from '../utils/auth';
import { getDefaultKeyPaths, IKeys, loadKeys } from '../utils/key-pairs';
import { IUser, UserRole, UsersModel } from '../models/users.model';
import { IncomingMessage } from 'http';
import { JwtBearerScope } from '../utils/openapi';
import { ErrorCode, LogicError } from './error.service';
import { DeepReadonly, Nullable } from '../@types';

export interface IUserForToken {
  userId: number;
  role: UserRole;
}

@injectable()
export class AuthService {
  static readonly [ASYNC_INIT] = true;
  readonly [ASYNC_INIT]: Promise<void>;
  private _jwtConfig: DeepReadonly<Pick<IJwtConfig, 'expiration' | 'issuer' | 'algorithms'>>;
  private _keys!: IConfigTokenTypesDescriptor<IKeys>;
  private _usersModel: UsersModel;

  constructor(
    @inject(UsersModel) usersModel: UsersModel,
    keyPaths = getDefaultKeyPaths(),
  ) {
    this._jwtConfig = getJwtConfig();
    if (!isValidAlgorithm(this._jwtConfig.algorithms.accessToken)) {
      throw new TypeError(`The access token algorithm must comply to ${getAlgorithmVariants()}`);
    }
    if (!isValidAlgorithm(this._jwtConfig.algorithms.refreshToken)) {
      throw new TypeError(`The refresh token algorithm must comply to ${getAlgorithmVariants()}`);
    }
    this[ASYNC_INIT] = loadKeys(keyPaths, false).then(keys => {
      this._keys = keys;
    });
    this._usersModel = usersModel;
  }

  generateAccessToken(user: DeepReadonly<IUserForToken>) {
    return jwt.sign({
      id: user.userId,
      scopes: getJwtBearerScopes(user),
    }, this._keys.accessToken.privateKey, {
      algorithm: this._jwtConfig.algorithms.accessToken,
      subject: user.userId.toString(),
      audience: jwtAudience,
      expiresIn: this._jwtConfig.expiration.accessToken,
      issuer: this._jwtConfig.issuer,
    });
  }

  generateRefreshToken(user: DeepReadonly<IUserForToken>) {
    return jwt.sign({
      id: user.userId,
      scopes: [JwtBearerScope.TOKEN_REFRESH],
    }, this._keys.refreshToken.privateKey, {
      algorithm: this._jwtConfig.algorithms.refreshToken,
      subject: user.userId.toString(),
      audience: jwtAudience,
      expiresIn: this._jwtConfig.expiration.refreshToken,
      issuer: this._jwtConfig.issuer,
    });
  }

  getAccessTokenPayload(
    token: string,
    scopes: Nullable<ReadonlyArray<JwtBearerScope>> = null,
    ignoreExpiration = false,
  ) {
    let payload: object | string;
    try {
      payload = jwt.verify(token, this._keys.accessToken.publicKey, {
        ignoreExpiration,
        audience: jwtAudience,
        algorithms: [this._jwtConfig.algorithms.accessToken],
        issuer: this._jwtConfig.issuer,
      });
    } catch (err) {
      handleJwtError(err);
    }
    if (!isJwtPayload(payload!)) {
      throw new LogicError(ErrorCode.AUTH_BAD);
    }
    if (scopes) {
      assertRequiredScopes(scopes, payload.scopes);
    }
    return payload;
  }

  getRefreshTokenPayload(
    token: string,
    checkScope = true,
    ignoreExpiration = false,
  ) {
    let payload: object | string;
    try {
      payload = jwt.verify(token, this._keys.refreshToken.publicKey, {
        ignoreExpiration,
        audience: jwtAudience,
        algorithms: [this._jwtConfig.algorithms.refreshToken],
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
    scopes: Nullable<ReadonlyArray<JwtBearerScope>> = null,
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
    scopes: Nullable<ReadonlyArray<JwtBearerScope>> = null,
    ignoreExpiration = false,
  ) {
    const payload = this.getAccessTokenPayload(
      token,
      scopes,
      ignoreExpiration,
    );
    return this.getUserFromPayload(payload);
  }

  async getUserFromPayload(
    payload: DeepReadonly<IJwtPayload>,
  ) {
    const user = await this._usersModel.getOne({ userId: payload.id });
    if (!user) {
      throw new LogicError(ErrorCode.AUTH_BAD);
    }
    return user;
  }
}
