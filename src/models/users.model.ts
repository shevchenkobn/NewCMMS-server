import { compare, hash } from 'bcrypt';
import { inject, injectable } from 'inversify';
import * as randomatic from 'randomatic';
import { DeepReadonly, Nullable } from '../@types';
import { DbConnection } from '../services/db-connection.class';
import { ErrorCode, LogicError } from '../services/error.service';
import { TableName } from '../utils/db-orchestrator';

export enum UserRole {
  EMPLOYEE = 1,
  ADMIN = 2,
}

export function getUserRoleLimits(): [number, number] {
  return [UserRole.EMPLOYEE, UserRole.ADMIN];
}

export interface IUserCreateNoPassword {
  userId?: number;
  role: UserRole;
  email: string;
  fullName: string;
}

export interface IUserCreate extends IUserCreateNoPassword {
  password: string;
}

export interface IUser extends IUserCreateNoPassword {
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

export const maxBcryptStringToHashLength = 72;
export const bcryptOptimalHashCycles = 13;

@injectable()
export class UsersModel {
  private _dbConnection: DbConnection;

  get table() {
    return this._dbConnection.knex(TableName.USERS);
  }

  constructor(@inject(DbConnection) dbConnection: DbConnection) {
    this._dbConnection = dbConnection;
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
    if (!user) {
      throw new LogicError(ErrorCode.USER_EMAIL_BAD);
    }
    if (!await compare(userCredentials.password, user.passwordHash!)) {
      throw new LogicError(ErrorCode.USER_PASSWORD_BAD);
    }
    if (!passwordHashRequested) {
      delete user.passwordHash;
    }
    return user;
  }

  getOne(email: DeepReadonly<IUserEmail>): Promise<Nullable<IUser>>;
  getOne<T extends Partial<IUserFromDB> = Partial<IUserFromDB>>(
    email: DeepReadonly<IUserEmail>,
    returning: ReadonlyArray<keyof IUserFromDB>,
  ): Promise<Nullable<T>>;
  getOne(userId: DeepReadonly<IUserId>): Promise<Nullable<IUser>>;
  getOne<T extends Partial<IUserFromDB> = Partial<IUserFromDB>>(
    userId: DeepReadonly<IUserId>,
    returning: ReadonlyArray<keyof IUserFromDB>,
  ): Promise<Nullable<T>>;
  async getOne(
    emailOrUserId: DeepReadonly<IUserEmail | IUserId>,
    returning = getAllSafeUserPropertyNames() as
      ReadonlyArray<keyof IUserFromDB>,
  ): Promise<Nullable<IUserFromDB | Partial<IUserFromDB>>> {
    if (!isValidUserUniqueIdentifier(emailOrUserId)) {
      throw new LogicError(
        ErrorCode.USER_EMAIL_AND_ID,
        'Both email and user id present. Use only one of them.',
      );
    }
    const users = await this.table.where(emailOrUserId)
      .select(returning as any);
    if (users.length === 0) {
      return null;
    }
    return users[0];
  }

  deleteOne(email: DeepReadonly<IUserEmail>): Promise<void>;
  deleteOne(userId: DeepReadonly<IUserId>): Promise<void>;
  async deleteOne(
    emailOrUserId: DeepReadonly<IUserEmail | IUserId>,
  ): Promise<void> {
    if (!isValidUserUniqueIdentifier(emailOrUserId)) {
      throw new LogicError(
        ErrorCode.USER_EMAIL_AND_ID,
        'Both email and user id present. Use only one of them.',
      );
    }
    return this.table.where(emailOrUserId).delete();
  }

  create<T extends Partial<IUser> = Partial<IUser>>(
    user: DeepReadonly<IUserCreate>,
    returning: ReadonlyArray<keyof IUserCreate>,
  ): Promise<T>;
  create(
    user: DeepReadonly<IUserCreate>,
  ): Promise<void>;
  create<T extends Partial<IUserWithPassword> = Partial<IUserWithPassword>>(
    user: DeepReadonly<IUserCreateNoPassword>,
    returning: ReadonlyArray<keyof IUserWithPassword>,
  ): Promise<T>;
  create(
    user: DeepReadonly<IUserCreateNoPassword>,
  ): Promise<void>;
  async create(
    user: DeepReadonly<IUserCreateNoPassword & IUserCreate>,
    returning?: ReadonlyArray<keyof (IUserCreateNoPassword & IUserCreate)>,
  ): Promise<IUser | Partial<IUser> | void> {
    const { password = getRandomPassword(), ...userSeed } =
      user as (IUserWithPassword & IUserFromDB);
    userSeed.passwordHash = await hash(password, bcryptOptimalHashCycles);
    if (!user.password) {
      if (!returning || !returning.includes('password')) {
        throw new LogicError(
          ErrorCode.USER_PASSWORD_SAVE_NO,
          'Password is being generated by ignored by caller!',
        );
      }
      const newUser = await this.table
        .insert(userSeed, returning as string[]) as IUserWithPassword;
      newUser.password = password;
      return newUser;
    }
    return await this.table
      .insert(userSeed, returning as string[]) as IUser;
  }
}

export function isValidUserUniqueIdentifier(
  emailOrUserId: DeepReadonly<IUserEmail | IUserId>,
): emailOrUserId is (IUserEmail | IUserId) {
  return Object.keys(emailOrUserId).length === 1 && (
    'email' in emailOrUserId
    || 'userId' in emailOrUserId
  );
}

export function getRandomPassword() {
  return randomatic('aA0!', maxBcryptStringToHashLength);
}

export function getAllSafeUserPropertyNames(): (keyof IUser)[] {
  return ['userId', 'email', 'role', 'fullName'];
}
