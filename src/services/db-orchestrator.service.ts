import { inject, injectable } from 'inversify';
import { DbConnection } from './db-connection.class';
import * as Knex from 'knex';
import {
  getTableNames,
  TableBuilders,
} from '../utils/db-orchestrator';
import { Nullable } from '../@types';

export enum TableName {
  USERS = 'users',
  USER_STATISTICS = 'userStatistics',
  TRIGGER_DEVICES = 'triggerDevices',
  ACTION_DEVICES = 'triggerDevices',
  TRIGGER_ACTIONS = 'triggerActions',
  BILLS = 'bills',
}

export type CreateTableCallback = {
  (tableName: string, dropped: true, sqlQuery: string): void;
  (tableName: string, dropped: false): void;
};

@injectable()
export class DbOrchestrator {
  private _connection: DbConnection;
  private _knex: Knex;
  private _tableBuilders: Nullable<TableBuilders>;

  constructor(@inject(DbConnection) dbConnection: DbConnection) {
    this._connection = dbConnection;
    this._knex = this._connection.knex;
    this._tableBuilders = null;
  }

  async createTables(
    newTableNames?: TableName[],
    safe = true,
    createTableCallback?: CreateTableCallback,
  ) {
    const orderedTables = newTableNames !== undefined
      ? newTableNames
      : getTableNames().filter(t => newTableNames!.includes(t));
    if (newTableNames && orderedTables.length !== newTableNames.length) {
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
          createTableCallback(table, exists, (builder as any).toQuery());
        } else {
          createTableCallback(table, exists);
        }
      }
    }
  }
}
