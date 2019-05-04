import { inject, injectable } from 'inversify';
import {
  getAllSafeUserPropertyNames,
  IUser,
  IUserCredentials,
  IUserFromDB, UsersModel,
} from '../../models/users.model';
import { AuthService, IUserForToken } from '../../services/auth.service';

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
    );
    return Promise.props({
      accessToken: this.authService.generateAccessToken(user as IUserForToken),
      refreshToken: this.authService
        .generateRefreshToken(user as IUserForToken),
    });
  }
}
