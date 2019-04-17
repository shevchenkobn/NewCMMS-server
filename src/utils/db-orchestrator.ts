import { Nullable } from '../@types';
import * as Knex from 'knex';
import { TableName } from '../services/db-orchestrator.service';
import { logger } from '../services/logger.service';
import { DbConnection } from '../services/db-connection.class';
import { oc } from 'ts-optchain';

let tableNames: Nullable<ReadonlyArray<TableName>> = null;
export function getTableNames() {
  if (!tableNames) {
    tableNames = Object.values(TableName);
  }
  return tableNames;
}

export class TableBuilders {
  private _knex: Knex;
  private _tableFactories: Map<TableName, () => Knex.SchemaBuilder>;
  private readonly _columnBuilders: TableColumnTypeBuilder;
  private readonly _n: (...args: string[]) => Knex.Raw;
  private _tableIdColumns: Nullable<Map<TableName, string>>;

  constructor(dbConnection: DbConnection) {
    this._knex = dbConnection.knex;
    this._n = (...args: string[]) => dbConnection.getIdentifier(...args);
    this._tableIdColumns = null;

    this._tableFactories = this.getTableFactories();
    let dbmsClient;
    if (typeof dbConnection.config.client === 'string') {
      dbmsClient = dbConnection.config.client;
    } else {
      // maybe other approach is needed, no info found
      const defaultDbms = 'default-sql';
      logger.warn(`The DBMS client type wasn't defined! Falling back to "${defaultDbms}"`);
      dbmsClient = defaultDbms;
    }
    this._columnBuilders = TableColumnTypeBuilder.getForDbmsClient(dbmsClient);
  }

  getFor(tableName: TableName) {
    return this._tableFactories.get(tableName)!();
  }

  private getTableFactories() {
    const c = this._columnBuilders;
    return new Map([
      [TableName.USERS, () => this._knex.schema.createTable(
        TableName.USERS,
        table => {
          table.increments('userId').primary().notNullable();
          table.string('email', 90).unique().notNullable();
          table.string('passwordHash', 60).notNullable();
          table.string('fullName', 90).notNullable();
        },
      )],
      [TableName.TRIGGER_DEVICES, () => this._knex.schema.createTable(
        TableName.TRIGGER_DEVICES,
        table => {
          table.increments('triggerDeviceId').primary().notNullable();
          c.addColumn(table, SpecificDBDataTypes.MAC_ADDRESS, 'physicalAddress');
          table.string('name', 75).unique().notNullable();
          table.string('type', 75).notNullable();
        },
      )],
      [TableName.ACTION_DEVICES, () => this._knex.schema.createTable(
        TableName.ACTION_DEVICES,
        table => {
          table.increments('actionDeviceId').primary().notNullable();
          c.addColumn(table, SpecificDBDataTypes.MAC_ADDRESS, 'physicalAddress');
          table.string('name', 75).unique().notNullable();
          table.string('type', 75).notNullable();
        },
      )],
      [TableName.TRIGGER_ACTIONS, () => this._knex.schema.createTable(
        TableName.TRIGGER_ACTIONS,
        table => {
          table.increments('triggerActionId').primary().notNullable();
          table.increments('triggerDeviceId').references(this._n(TableName.TRIGGER_DEVICES, 'trigger'));
        },
      )],
    ]);
  }
}

const enum SpecificDBDataTypes {
  UINT1, MAC_ADDRESS,
}

class TableColumnTypeBuilder {
  private static _cache: Nullable<Map<string, TableColumnTypeBuilder>> = null;
  static getForDbmsClient(dbmsClient: string) {
    if (!this._cache) {
      this._cache = new Map();
    }
    let builder = this._cache.get(dbmsClient);
    if (!builder) {
      builder = new TableColumnTypeBuilder(dbmsClient);
      this._cache.set(dbmsClient, builder);
    }
    return builder;
  }

  private _dbmsClient: string;
  private _columnFactories: Map<
    SpecificDBDataTypes,
    (table: Knex.CreateTableBuilder, name: string) => Knex.ColumnBuilder
  >;

  private constructor(dbmsClient: string) {
    this._dbmsClient = dbmsClient;

    this._columnFactories = this.getColumnFactories();
  }

  addColumn(
    table: Knex.CreateTableBuilder,
    type: SpecificDBDataTypes,
    name: string,
  ) {
    return this._columnFactories.get(type)!(table, name);
  }

  private getColumnFactories(): Map<
    SpecificDBDataTypes,
    (table: Knex.CreateTableBuilder, name: string) => Knex.ColumnBuilder
  > {
    switch (this._dbmsClient) {
      case 'pg':
        return new Map([
          [
            SpecificDBDataTypes.UINT1,
            (table, name) => table.specificType(name, 'SMALLINT'),
          ],
          [
            SpecificDBDataTypes.MAC_ADDRESS,
            (table, name) => table.specificType(name, 'macaddr'),
          ],
        ]);

      default:
        logger.warn(`Specific types for "${this._dbmsClient}" are not supported!`);
        return new Map([
          [
            SpecificDBDataTypes.UINT1,
            (table, name) => table.integer(name),
          ],
          [
            SpecificDBDataTypes.MAC_ADDRESS,
            (table, name) => table.string(name, 12),
          ],
        ]);
    }
  }
}
