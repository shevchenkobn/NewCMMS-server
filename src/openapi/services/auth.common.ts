import { inject, injectable } from 'inversify';
import { DeepReadonly } from '../../@types';
import { IUserCredentials, UsersModel } from '../../models/users.model';
import { AuthService, IUserForToken } from '../../services/auth.service';
import { ErrorCode, LogicError } from '../../services/error.service';
import { getIdColumn, TableName } from '../../utils/db-orchestrator';

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

@injectable()
export class AuthCommon {
  readonly authService: AuthService;
  readonly usersModel: UsersModel;

  constructor(
    @inject(AuthService) authService: AuthService,
    @inject(UsersModel) usersModel: UsersModel,
  ) {
    this.authService = authService;
    this.usersModel = usersModel;
  }

  async getTokensForUser(
    userCredentials: DeepReadonly<IUserCredentials>,
  ): Promise<ITokenPair> {
    const user = await this.usersModel.getAssertedUser<IUserForToken>(
      userCredentials,
      [getIdColumn(TableName.USERS) as 'userId', 'role'],
    );
    return {
      accessToken: this.authService.generateAccessToken(user),
      refreshToken: this.authService
        .generateRefreshToken(user),
    };
  }

  async getNewAccessToken(tokenPair: ITokenPair): Promise<string> {
    const accessTokenPayload = this.authService
      .getAccessTokenPayload(tokenPair.accessToken, null, true);
    const refreshTokenPayload = this.authService
      .getRefreshTokenPayload(tokenPair.refreshToken);
    if (accessTokenPayload.id !== refreshTokenPayload.id) {
      throw new LogicError(ErrorCode.AUTH_BAD);
    }
    const user = await this.authService.getUserFromPayload(accessTokenPayload);
    return this.authService.generateAccessToken(user);
  }
}
