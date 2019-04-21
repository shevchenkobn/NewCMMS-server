import { inject, injectable } from 'inversify';
import { DbConnection } from '../services/db-connection.class';
import { hash } from 'bcrypt';
import { TableName } from '../services/db-orchestrator.service';

export enum UserRole {
  EMPLOYEE = 1,
  ADMIN = 2,
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

export interface IUser extends IUserCreate {
  userId: number;
}

export interface IUserWithPassword extends IUser, IUserCreateNoPassword {
  userId: number;
}

export interface IDBUser extends IUser {
  passwordHash: string;
}

@injectable()
export class UsersModel {
  private _dbConnection: DbConnection;

  public get table() {
    return this._dbConnection.knex(TableName.USERS);
  }

  constructor(@inject(DbConnection) dbConnection: DbConnection) {
    this._dbConnection = dbConnection;
  }

  create(
    user: Readonly<IUserCreate>,
    returning?: ReadonlyArray<keyof IUserCreate>,
  ): Promise<IUser>;
  create(
    user: Readonly<IUserCreateNoPassword>,
    returning?: ReadonlyArray<keyof IUserWithPassword>,
  ): Promise<IUserWithPassword>;
  async create(
    user: Readonly<IUserCreateNoPassword & IUserCreate>,
    returning?: ReadonlyArray<keyof (IUserCreateNoPassword & IUserCreate)>,
  ): Promise<IUser> {
    const { password, ...userSeed } = user as (IUserWithPassword & IDBUser);
    if (password) {
      userSeed.passwordHash = await hash(password, 13);
    }
    return await this.table.insert(userSeed, returning as string[]);
  }
}
