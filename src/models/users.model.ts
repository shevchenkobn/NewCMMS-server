import { compare, hash } from 'bcrypt';
import { inject, injectable } from 'inversify';
import { DeepPartial, DeepReadonly, Nullable } from '../@types';
import { DbConnection } from '../services/db-connection.class';
import { ErrorCode, LogicError } from '../services/error.service';
import { getIdColumn, TableName } from '../utils/db-orchestrator';
import { applySortingToQuery, ComparatorFilters } from '../utils/model';
import {
  bcryptOptimalHashCycles,
  getAllSafeUserPropertyNames,
  getRandomPassword,
  isValidUserUniqueIdentifier,
  UserRole,
} from '../utils/models/users';

export interface IUserChangeNoPassword {
  role: UserRole;
  email: string;
  fullName: string;
}

export interface IUserUpdate extends IUserChangeNoPassword {
  password: string | '';
}

export interface IUserCreate extends IUserChangeNoPassword {
  userId?: number;
  password: string;
}

export interface IUser extends IUserChangeNoPassword {
  userId: number;
}

export interface IUserWithPassword extends IUser, IUserCreate {
  userId: number;
}

export interface IUserFromDB extends IUser {
  passwordHash: string;
}

export interface IUserCredentials {
  email: string;
  password: string;
}

export interface IUserId {
  userId: number;
}

export interface IUserEmail {
  email: string;
}

export interface IUsersSelectParams {
  select?: ReadonlyArray<keyof IUser>;
  userIds?: ReadonlyArray<number>;
  comparatorFilters?: DeepReadonly<ComparatorFilters<IUser>>;
  orderBy?: ReadonlyArray<string>;
  offset?: number;
  limit?: number;
}

@injectable()
export class UsersModel {
  private _dbConnection: DbConnection;
  private _handleError: (err: any) => never;

  get table() {
    return this._dbConnection.knex(TableName.USERS);
  }

  constructor(@inject(DbConnection) dbConnection: DbConnection) {
    this._dbConnection = dbConnection;
    switch (this._dbConnection.config.client) {
      case 'pg':
        this._handleError = err => {
          switch (err.code) {
            case '23505':
              const detailLower = err.detail.toLowerCase();
              if (detailLower.includes('email')) {
                throw new LogicError(ErrorCode.USER_EMAIL_DUPLICATE);
              }
            default:
              throw err;
          }
        };
        break;
      default:
        throw new TypeError(`Cannot create handler for database errors for ${this._dbConnection.config.client}`);
    }
  }

  getAssertedUser(
    userCredentials: DeepReadonly<IUserCredentials>,
  ): Promise<IUser>;
  getAssertedUser<T extends Partial<IUserFromDB> = Partial<IUserFromDB>>(
    userCredentials: DeepReadonly<IUserCredentials>,
    returning: ReadonlyArray<keyof IUserFromDB>,
  ): Promise<T>;
  async getAssertedUser(
    userCredentials: DeepReadonly<IUserCredentials>,
    returning = getAllSafeUserPropertyNames() as
      ReadonlyArray<keyof IUserFromDB>,
  ) {
    if (!userCredentials.password) {
      throw new LogicError(ErrorCode.USER_PASSWORD_NO);
    }
    const select = returning.slice();
    const passwordHashRequested = returning.includes('passwordHash');
    if (!passwordHashRequested) {
      select.push('passwordHash');
    }
    const user = await this.getOne({ email: userCredentials.email }, select);
    if (!user || !await compare(userCredentials.password, user.passwordHash!)) {
      throw new LogicError(ErrorCode.USER_CREDENTIALS_BAD);
    }
    if (!passwordHashRequested) {
      delete user.passwordHash;
    }
    return user;
  }

  getOne(email: DeepReadonly<IUserEmail>): Promise<Nullable<IUser>>;
  getOne<T extends Partial<IUserFromDB> = Partial<IUserFromDB>>(
    email: DeepReadonly<IUserEmail>,
    select: ReadonlyArray<keyof IUserFromDB>,
  ): Promise<Nullable<T>>;
  getOne(userId: DeepReadonly<IUserId>): Promise<Nullable<IUser>>;
  getOne<T extends Partial<IUserFromDB> = Partial<IUserFromDB>>(
    userId: DeepReadonly<IUserId>,
    select: ReadonlyArray<keyof IUserFromDB>,
  ): Promise<Nullable<T>>;
  async getOne(
    emailOrUserId: DeepReadonly<IUserEmail | IUserId>,
    select = getAllSafeUserPropertyNames() as
      ReadonlyArray<keyof IUserFromDB>,
  ): Promise<Nullable<IUserFromDB | Partial<IUserFromDB>>> {
    if (!isValidUserUniqueIdentifier(emailOrUserId)) {
      throw new LogicError(
        ErrorCode.USER_EMAIL_AND_ID,
        'Both email and user id present. Use only one of them.',
      );
    }
    const users = await this.table.where(emailOrUserId)
      .select(select as any);
    if (users.length === 0) {
      return null;
    }
    return users[0];
  }

  getList<T extends Partial<IUser> = IUser>(params: IUsersSelectParams): Promise<T[]> {
    const query = this.table;
    if (params.userIds && params.userIds.length > 0) {
      query.whereIn(getIdColumn(TableName.USERS), params.userIds.slice());
    }
    if (params.comparatorFilters && params.comparatorFilters.length > 0) {
      for (const filter of params.comparatorFilters) {
        query.where(...(filter as [string, string, any]));
      }
    }
    if (typeof params.offset === 'number') {
      query.offset(params.offset);
    }
    if (typeof params.limit === 'number') {
      query.limit(params.limit);
    }
    if (params.orderBy && params.orderBy.length > 0) {
      applySortingToQuery(query, params.orderBy);
    }
    return query.select(
      (params.select && params.select.length > 0
        ? params.select.slice()
        : getAllSafeUserPropertyNames()) as string[],
    ) as any as Promise<T[]>;
  }

  deleteOne(email: DeepReadonly<IUserEmail>): Promise<Nullable<{}>>;
  deleteOne<T extends DeepPartial<IUserFromDB> = DeepPartial<IUserFromDB>>(
    email: DeepReadonly<IUserEmail>,
    returning: ReadonlyArray<keyof IUserFromDB>,
  ): Promise<Nullable<T>>;
  deleteOne(userId: DeepReadonly<IUserId>): Promise<Nullable<{}>>;
  deleteOne<T extends DeepPartial<IUserFromDB> = DeepPartial<IUserFromDB>>(
    userId: DeepReadonly<IUserId>,
    returning: ReadonlyArray<keyof IUserFromDB>,
  ): Promise<Nullable<T>>;
  deleteOne(
    emailOrUserId: DeepReadonly<IUserEmail | IUserId>,
    returning?: ReadonlyArray<keyof IUserFromDB>,
  ): Promise<Nullable<DeepPartial<IUserFromDB> | {}>> {
    if (!isValidUserUniqueIdentifier(emailOrUserId)) {
      throw new LogicError(
        ErrorCode.USER_EMAIL_AND_ID,
        'Both email and user id present. Use only one of them.',
      );
    }
    return this.table.where(emailOrUserId).delete(returning as string[])
      .then(users => {
        if (!returning || returning.length === 0) {
          return users === 0 ? null : {};
        }
        return users.length === 0 ? null : users[0];
      })
      .catch(this._handleError) as any;
  }

  createOne<T extends Partial<IUser> = Partial<IUser>>(
    user: DeepReadonly<IUserCreate>,
    returning: ReadonlyArray<keyof IUserCreate>,
  ): Promise<T>;
  createOne(
    user: DeepReadonly<IUserCreate>,
  ): Promise<{}>;
  createOne<T extends Partial<IUserWithPassword> = Partial<IUserWithPassword>>(
    user: DeepReadonly<IUserChangeNoPassword>,
    returning: ReadonlyArray<keyof IUserWithPassword>,
  ): Promise<T>;
  createOne(
    user: DeepReadonly<IUserChangeNoPassword>,
  ): Promise<{}>;
  async createOne(
    user: DeepReadonly<IUserChangeNoPassword & IUserCreate>,
    returning?: ReadonlyArray<keyof (IUserWithPassword & IUserCreate)>,
  ): Promise<IUser | Partial<IUser> | void> {
    const { password = getRandomPassword(), ...userSeed } =
      user as (IUserWithPassword & IUserFromDB);
    const passwordIndex = returning ? returning.indexOf('password') : -1;
    if (!user.password) {
      if (passwordIndex < 0) {
        throw new LogicError(
          ErrorCode.USER_PASSWORD_SAVE_NO,
          'Password is being generated by ignored by caller!',
        );
      }
    } else {
      if (passwordIndex >= 0) {
        throw new LogicError(
          ErrorCode.USER_PASSWORD_PROVIDED,
          'Password is not generated but requested!',
        );
      }
    }
    userSeed.passwordHash = await hash(password, bcryptOptimalHashCycles);
    let select;
    if (returning) {
      select = returning.slice();
      if (passwordIndex >= 0) {
        select.splice(passwordIndex, 1);
      }
    } else {
      select = [] as (keyof IUser)[];
    }
    return this.table
      .insert(userSeed, select as string[])
      .catch(this._handleError)
      .then(
        users => {
          if (!returning) {
            return {};
          }
          const user = users[0];
          if (passwordIndex >= 0) {
            user.password = password;
          }
          return user;
        },
      );
  }

  updateOne(
    userId: number,
    update: DeepReadonly<IUserChangeNoPassword>,
  ): Promise<Nullable<{}>>;
  updateOne<T extends DeepPartial<IUser> = DeepPartial<IUser>>(
    userId: number,
    update: DeepReadonly<IUserChangeNoPassword>,
    returning: ReadonlyArray<keyof IUser>,
  ): Promise<Nullable<T>>;
  updateOne<T extends DeepPartial<IUserWithPassword> = DeepPartial<IUserWithPassword>>(
    userId: number,
    update: DeepReadonly<IUserChangeNoPassword & { password: '' }>,
    returning: ReadonlyArray<keyof IUserWithPassword>,
  ): Promise<Nullable<T>>;
  updateOne(
    userId: number,
    update: DeepReadonly<IUserChangeNoPassword & { password: string }>,
  ): Promise<Nullable<{}>>;
  updateOne<T extends DeepPartial<IUser> = DeepPartial<IUser>>(
    userId: number,
    update: DeepReadonly<IUserChangeNoPassword & { password: string }>,
    returning: ReadonlyArray<keyof IUser>,
  ): Promise<Nullable<T>>;
  async updateOne<T extends DeepPartial<IUser> = DeepPartial<IUser>>(
    userId: number,
    update: DeepReadonly<IUserUpdate>,
    returning?: ReadonlyArray<keyof IUserWithPassword>,
  ): Promise<Nullable<DeepPartial<IUserWithPassword> | {}>> {
    // tslint:disable-next-line:prefer-const
    let { password, ...userSeed } = update as (IUserUpdate & IUserFromDB);
    const passwordIndex = returning ? returning.indexOf('password') : -1;
    if (password === '') {
      if (passwordIndex < 0) {
        throw new LogicError(ErrorCode.USER_PASSWORD_SAVE_NO);
      }
      password = getRandomPassword();
    } else if (passwordIndex >= 0) {
      throw new LogicError(ErrorCode.USER_PASSWORD_NO);
    }
    if (password) {
      userSeed.passwordHash = await hash(password, bcryptOptimalHashCycles);
    }
    let select;
    if (returning) {
      select = returning.slice();
      if (passwordIndex >= 0) {
        select.splice(passwordIndex, 1);
      }
    } else {
      select = [] as (keyof IUser)[];
    }
    return this.table.where({ userId }).update(userSeed, select)
      .then(users => {
        if (!returning) {
          return users === 0 ? null : {};
        }
        if (users.length === 0) {
          return null;
        }
        const user = users[0];
        if (passwordIndex >= 0) {
          user.password = password;
        }
        return user;
      })
      .catch(this._handleError);
  }
}
