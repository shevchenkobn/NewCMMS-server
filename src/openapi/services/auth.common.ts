import { inject, injectable } from 'inversify';
import { IUserCredentials, UsersModel } from '../../models/users.model';
import { AuthService, IUserForToken } from '../../services/auth.service';
import { DeepNonMayble } from '../../@types';
import { ErrorCode, LogicError } from '../../services/error.service';

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

@injectable()
export class AuthCommon {
  public readonly authService: AuthService;
  public readonly usersModel: UsersModel;

  constructor(
    @inject(AuthService) authService: AuthService,
    @inject(UsersModel) usersModel: UsersModel,
  ) {
    this.authService = authService;
    this.usersModel = usersModel;
  }

  async getTokensForUser(
    userCredentials: IUserCredentials,
  ): Promise<ITokenPair> {
    const user = await this.usersModel.getAssertedUser(
      userCredentials,
      ['userId', 'role'],
    ) as DeepNonMayble<IUserForToken>;
    return {
      accessToken: this.authService.generateAccessToken(user),
      refreshToken: this.authService
        .generateRefreshToken(user),
    };
  }

  async getNewAccessToken(tokenPair: ITokenPair): Promise<string> {
    const accessTokenPayload = this.authService
      .getAccessTokenPayload(tokenPair.accessToken);
    const refreshTokenPayload = this.authService
      .getRefreshTokenPayload(tokenPair.refreshToken);
    if (accessTokenPayload.id !== refreshTokenPayload.id) {
      throw new LogicError(ErrorCode.AUTH_BAD);
    }
    const user = await this.authService.getUserFromPayload(accessTokenPayload);
    return this.authService.generateAccessToken(user);
  }
}
