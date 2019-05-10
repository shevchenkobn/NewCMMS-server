import { inject, injectable } from 'inversify';
import { oc } from 'ts-optchain';
import { DeepReadonly, Nullable, Optional } from '../../@types';
import {
  IUser,
  IUserCreate,
  IUserCreateNoPassword, IUsersSelectParams,
  IUserWithPassword,
  UsersModel,
} from '../../models/users.model';
import { ErrorCode, LogicError } from '../../services/error.service';
import { differenceArrays, mergeArrays } from '../../utils/common';
import { PaginationCursor } from '../../utils/model';

export interface IUserList {
  users: IUser[];
  cursor: Nullable<string>;
}

export interface IGetUsersParams {
  select?: ReadonlyArray<keyof IUser>;
  userIds?: ReadonlyArray<number>;
  skip?: number;
  limit?: number;
  sort?: ReadonlyArray<string>;
  cursor?: string;
  generateCursor?: boolean;
}

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

  async getUsers(params: Readonly<IGetUsersParams>): Promise<IUserList> {
    const args = Object.assign({ generateCursor: true }, params);
    let cursor = null;
    if (args.sort) {
      cursor = new PaginationCursor<IUser>(args.sort, args.cursor);
    } else {
      if (args.cursor) {
        throw new LogicError(ErrorCode.SORT_NO);
      }
    }
    const modelParams = {
      userIds: args.userIds,
      orderBy: args.sort,
      offset: args.skip,
      limit: args.limit,
    } as IUsersSelectParams;
    if (args.select) {
      modelParams.select = cursor
        ? mergeArrays(args.select, cursor.getFilteredFieldNames())
        : args.select;
    }
    if (cursor) {
      modelParams.comparatorFilters = cursor.filterField
        ? [cursor.filterField]
        : [];
    }
    const users = await this.usersModel.getList(modelParams);
    if (cursor) {
      if (args.generateCursor) {
        cursor.updateFromList(users);
      }
      cursor.removeIrrelevantFromList(users);
    }
    if (
      modelParams.select
      && args.select
      && modelParams.select.length !== args.select.length
    ) {
      const propsToDelete = differenceArrays(modelParams.select, args.select);
      for (const user of users) {
        for (const prop of propsToDelete) {
          delete user[prop];
        }
      }
    }
    return {
      users,
      cursor: args.generateCursor && cursor
        ? cursor.toString()
        : null,
    };
  }
}
