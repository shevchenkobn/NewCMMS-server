import { TYPES } from '../di/types';
import { injectable, inject } from 'inversify';
import { DbConnection } from './db-connection.class';
import * as Knex from 'knex';
import { Maybe, Optional } from '../@types';

export enum TableName {
  USERS = 'users',
  USER_STATISTICS = 'userStatistics',
  TRIGGER_DEVICES = 'triggerDevices',
  ACTION_DEVICES = 'triggerDevices',
  TRIGGER_ACTIONS = 'triggerActions',
  BILLS = 'bills',
}

export const tableNames: ReadonlyArray<TableName> = Object.values(TableName);

export type DropTableCallback = {
  (tableName: string, dropped: true, sqlQuery: string): void;
  (tableName: string, dropped: false): void;
}

@injectable()
export class DbOrchestrator {
  private _connection: DbConnection;
  private _knex: Knex;

  constructor(@inject(DbConnection) dbConnection: DbConnection) {
    this._connection = dbConnection;
    this._knex = this._connection.knex;
  }

  async dropTables(
    tableNames?: TableName[],
    safe = true,
    dropTableCallback?: DropTableCallback,
  ) {

  }

}
