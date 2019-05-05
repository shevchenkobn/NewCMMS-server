import * as config from 'config';
import { inject, injectable } from 'inversify';
import * as Knex from 'knex';
import { Maybe, Nullable } from '../@types';
import { IUserCreate, UsersModel } from '../models/users.model';
import {
  getChildTables,
  getTableNames,
  TableBuilders,
  TableName,
} from '../utils/db-orchestrator';
import { UserRole } from '../utils/models/users';
import { DbConnection } from './db-connection.class';

export type CreateTableCallback = {
  (tableName: TableName, existed: false, sqlQuery: string): void;
  (tableName: TableName, existed: true): void;
};

export type DropTableCallback = (
  tableName: TableName,
  sqlQuery: string,
) => void;

@injectable()
export class DbOrchestrator {
  private _connection: DbConnection;
  private _knex: Knex;
  private _tableBuilders: Nullable<TableBuilders>;
  private _usersModel: UsersModel;

  constructor(
    @inject(DbConnection) dbConnection: DbConnection,
    @inject(UsersModel) usersModel: UsersModel,
  ) {
    this._connection = dbConnection;
    this._usersModel = usersModel;
    this._knex = this._connection.knex;
    this._tableBuilders = null;
  }

  async dropTables(
    tableNames?: ReadonlyArray<TableName>,
    safe = true,
    resolveChildTables = true,
    dropTableCallback?: DropTableCallback,
  ) {
    let orderedTables = tableNames !== undefined
      ? getTableNames().filter(t => tableNames!.includes(t))
      : getTableNames();
    if (tableNames && orderedTables.length !== tableNames.length) {
      throw new TypeError('Bad table names. Use `TableName` enum.');
    }
    if (resolveChildTables && orderedTables.length < getTableNames().length) {
      orderedTables = Array.from(getChildTables(orderedTables));
    }

    for (let i = orderedTables.length - 1; i >= 0; i -= 1) {
      const table = orderedTables[i];
      const builder = safe
        ? this._knex.schema.dropTableIfExists(table)
        : this._knex.schema.dropTable(table);
      await builder;
      if (dropTableCallback) {
        dropTableCallback(table, builder.toQuery());
      }
    }
  }

  async createTables(
    tableNames?: ReadonlyArray<TableName>,
    safe = true,
    createTableCallback?: CreateTableCallback,
  ) {
    const orderedTables = tableNames !== undefined
      ? getTableNames().filter(t => tableNames!.includes(t))
      : getTableNames();
    if (tableNames && orderedTables.length !== tableNames.length) {
      throw new TypeError('Bad table names. Use `TableName` enum.');
    }

    if (!this._tableBuilders) {
      this._tableBuilders = new TableBuilders(this._connection);
    }
    for (let i = 0; i < orderedTables.length; i += 1) {
      const table = orderedTables[i];
      const exists = await this._knex.schema.hasTable(table);
      let builder = null;
      if (!safe || !exists) {
        builder = this._tableBuilders.getFor(table);
        await builder;
      }
      if (createTableCallback) {
        if (exists) {
          createTableCallback(table, exists);
        } else {
          createTableCallback(table, exists, builder!.toQuery());
        }
      }
    }
  }

  clearDatabaseSeed() {
    const email = config.get<string>('server.admin.email');
    return this._usersModel.deleteOne({ email });
  }

  seedDatabase() {
    const { id, name, email, password } = config.get<{
      id: Maybe<number>;
      name: string;
      email: string;
      password: string;
    }>('server.admin');

    const admin: IUserCreate = {
      email,
      password,
      role: UserRole.ADMIN | UserRole.EMPLOYEE,
      fullName: name,
    };

    // Doing a slight hack to preserve super admin id
    if (typeof id === 'number') {
      admin.userId = id;
    }

    return this._usersModel.createOne(admin);
  }
}

export const superAdminId = config.get<Maybe<number>>('server.admin.id');
