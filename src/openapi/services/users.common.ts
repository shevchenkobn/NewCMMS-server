import { inject, injectable } from 'inversify';
import { DeepPartial, DeepReadonly, Nullable, Optional } from '../../@types';
import {
  IUser,
  IUserChangeNoPassword,
  IUserCreate,
  IUsersSelectParams,
  IUserWithPassword,
  UsersModel,
} from '../../models/users.model';
import { superAdminId } from '../../services/db-orchestrator.class';
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

  createUser(user: DeepReadonly<IUserCreate>): Promise<{}>;
  createUser<T extends Partial<IUser> = Partial<IUser>>(
    user: DeepReadonly<IUserCreate>,
    returning: ReadonlyArray<keyof IUser>,
  ): Promise<T>;
  createUser(
    user: DeepReadonly<IUserChangeNoPassword>,
  ): Promise<{}>;
  createUser<T extends Partial<IUserWithPassword> = Partial<IUserWithPassword>>(
    user: DeepReadonly<IUserChangeNoPassword>,
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

  getUser(id: number): Promise<IUser>;
  getUser<T extends DeepPartial<IUser> = DeepPartial<IUser>>(
    id: number,
    select: ReadonlyArray<keyof IUser>,
  ): Promise<T>;
  async getUser(id: number, select?: ReadonlyArray<keyof IUser>) {
    const user = await (!select || select.length === 0
      ? this.usersModel.getOne({ userId: id })
      : this.usersModel.getOne({ userId: id }, select));
    if (!user) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return user;
  }

  deleteUser(userId: number): Promise<void>;
  deleteUser<T extends DeepPartial<IUser> = DeepPartial<IUser>>(
    userId: number,
    select: ReadonlyArray<keyof IUser>,
  ): Promise<T>;
  async deleteUser(
    userId: number,
    select?: ReadonlyArray<keyof IUser>,
  ): Promise<DeepPartial<IUser> | void> {
    if (userId === superAdminId) {
      throw new LogicError(ErrorCode.AUTH_ROLE);
    }
    const returnUser = select && select.length > 0;
    let user;
    if (returnUser) {
      user = await this.usersModel.getOne({ userId }, select!);
      if (!user) {
        throw new LogicError(ErrorCode.NOT_FOUND);
      }
    }
    const result = await this.usersModel.deleteOne({ userId });
    if (!result) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    if (user) {
      return user;
    }
    return {};
  }

  updateUser(
    userId: number,
    update: DeepPartial<IUserChangeNoPassword>,
  ): Promise<{}>;
  updateUser<T extends DeepPartial<IUser> = DeepPartial<IUser>>(
    userId: number,
    update: DeepPartial<IUserChangeNoPassword>,
    select: ReadonlyArray<keyof IUser>,
  ): Promise<T>;
  updateUser<T extends DeepPartial<IUserWithPassword> = DeepPartial<IUserWithPassword>>(
    userId: number,
    update: DeepPartial<IUserCreate>,
    select: ReadonlyArray<keyof IUser>,
  ): Promise<T>;
  async updateUser(
    userId: number,
    update: DeepPartial<IUserChangeNoPassword>,
    select?: ReadonlyArray<keyof IUserWithPassword>,
  ): Promise<DeepPartial<IUserWithPassword> | DeepPartial<IUser> | {}> {
    const user = await (select
      ? this.usersModel.updateOne(
        userId,
        update as IUserWithPassword,
        select as ReadonlyArray<keyof IUser>,
      )
      : this.usersModel.updateOne(userId, update as IUserWithPassword));
    if (!user) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return user;
  }

}
