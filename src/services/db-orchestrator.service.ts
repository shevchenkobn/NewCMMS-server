import { TYPES } from '../di/types';
import { injectable, inject } from 'inversify';
import { DbConnection } from './db-connection.class';
import * as Knex from 'knex';

export enum TableName {
  USERS = 'users',
  USER_STATISTICS = 'userStatistics',
  TRIGGER_DEVICES = 'triggerDevices',
  ACTION_DEVICES = 'triggerDevices',
  BILLS = 'bills',
}

export const tableNames: ReadonlyArray<TableName> = Object.values(TableName);

@injectable()
export class DbOrchestrator {
  private _connection: DbConnection;
  private _knex: Knex;

  constructor(@inject(DbConnection) dbConnection: DbConnection) {
    this._connection = dbConnection;
    this._knex = this._connection.knex;
  }
}
