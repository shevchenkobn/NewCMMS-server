import { inject, injectable } from 'inversify';
import { DeepPartial, DeepReadonly, Nullable, Optional } from '../../@types';
import {
  IUser,
  IUserChangeNoPassword,
  IUserCreate,
  IUserFromDB,
  IUsersSelectParams,
  IUserWithPassword,
  UsersModel,
} from '../../models/users.model';
import { superAdminId } from '../../services/db-orchestrator.class';
import { ErrorCode, LogicError } from '../../services/error.service';
import {
  deletePropsFromArray,
  differenceArrays,
  mergeArrays,
} from '../../utils/common';
import { PaginationCursor } from '../../utils/model';
import { UserRole } from '../../utils/models/users';

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
    return returning
      ? this.usersModel.createOne(user, returning)
      : this.usersModel.createOne(user);
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
      deletePropsFromArray(
        users,
        differenceArrays(modelParams.select, args.select),
      );
    }
    return {
      users,
      cursor: args.generateCursor && cursor
        ? cursor.toString()
        : null,
    };
  }

  getUser(userId: number): Promise<IUser>;
  getUser<T extends DeepPartial<IUser> = DeepPartial<IUser>>(
    userId: number,
    select: ReadonlyArray<keyof IUser>,
  ): Promise<T>;
  async getUser(userId: number, select?: ReadonlyArray<keyof IUser>) {
    const user = await (!select || select.length === 0
      ? this.usersModel.getOne({ userId })
      : this.usersModel.getOne({ userId }, select));
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
    const user = await this.usersModel.deleteOne(
      { userId },
      select as ReadonlyArray<keyof IUserFromDB>,
    );
    if (!user) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return user;
  }

  updateUser(
    userId: number,
    update: DeepPartial<IUserChangeNoPassword>,
    currentUser: IUser,
  ): Promise<{}>;
  updateUser<T extends DeepPartial<IUser> = DeepPartial<IUser>>(
    userId: number,
    update: DeepPartial<IUserChangeNoPassword>,
    select: ReadonlyArray<keyof IUser>,
    currentUser: IUser,
  ): Promise<T>;
  updateUser<T extends DeepPartial<IUserWithPassword> = DeepPartial<IUserWithPassword>>(
    userId: number,
    update: DeepPartial<IUserCreate>,
    select: ReadonlyArray<keyof IUser>,
    currentUser: IUser,
  ): Promise<T>;
  async updateUser(
    userId: number,
    update: DeepPartial<IUserChangeNoPassword>,
    selectOrCurrentUser: Optional<
      ReadonlyArray<keyof IUserWithPassword>
    > | IUser,
    currentUserParam?: IUser,
  ): Promise<DeepPartial<IUserWithPassword> | DeepPartial<IUser> | {}> {
    const hasSelect = Array.isArray(selectOrCurrentUser);
    const select = hasSelect
      ? selectOrCurrentUser
      : null;
    const currentUser = (currentUserParam || hasSelect
      ? currentUserParam
      : selectOrCurrentUser) as IUser;
    if (typeof update.role === 'number') {
      if (
        !(currentUser.role & UserRole.ADMIN)
        && update.role & UserRole.ADMIN
      ) {
        throw new LogicError(ErrorCode.AUTH_ROLE);
      }
      if (
        userId === superAdminId
        && !(update.role & UserRole.ADMIN)
      ) {
        throw new LogicError(ErrorCode.AUTH_ROLE);
      }
    }
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
