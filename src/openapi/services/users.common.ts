import { inject, injectable } from 'inversify';
import { DeepReadonly, Nullable, Optional } from '../../@types';
import {
  IUser,
  IUserCreate,
  IUserCreateNoPassword, IUserWithPassword,
  UsersModel,
} from '../../models/users.model';

@injectable()
export class UsersCommon {
  readonly usersModel: UsersModel;

  constructor(
    @inject(UsersModel) usersModel: UsersModel,
  ) {
    this.usersModel = usersModel;
  }

  createUser(user: DeepReadonly<IUserCreate>): Promise<void>;
  createUser<T extends Partial<IUser> = Partial<IUser>>(
    user: DeepReadonly<IUserCreate>,
    returning: ReadonlyArray<keyof IUser>,
  ): Promise<T>;
  createUser(
    user: DeepReadonly<IUserCreateNoPassword>,
  ): Promise<void>;
  createUser<T extends Partial<IUserWithPassword> = Partial<IUserWithPassword>>(
    user: DeepReadonly<IUserCreateNoPassword>,
    returning: ReadonlyArray<keyof IUserWithPassword>,
  ): Promise<T>;
  createUser(
    user: DeepReadonly<IUserCreate>,
    returning?: ReadonlyArray<keyof IUserWithPassword>,
  ) {
    const userSeed = { ...user } as
      (IUserCreate & { password: Optional<string> });
    if (!userSeed.password) {
      delete userSeed.password;
    }

    return returning
      ? this.usersModel.createOne(userSeed, returning)
      : this.usersModel.createOne(userSeed);
  }
}
