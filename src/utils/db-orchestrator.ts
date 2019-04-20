import { Nullable } from '../@types';
import * as Knex from 'knex';
import { TableName } from '../services/db-orchestrator.service';
import { logger } from '../services/logger.service';
import { DbConnection } from '../services/db-connection.class';

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

  constructor(dbConnection: DbConnection) {
    this._knex = dbConnection.knex;
    this._n = (...args: string[]) => dbConnection.getIdentifier(...args);

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
          table.increments(getIdColumn(TableName.USERS))
            .primary()
            .notNullable();
          table.string('email', 90).unique().notNullable();
          table.string('passwordHash', 60).notNullable();
          table.string('fullName', 90).notNullable();
        },
      )],
      [TableName.TRIGGER_DEVICES, () => this._knex.schema.createTable(
        TableName.TRIGGER_DEVICES,
        table => {
          table.increments(getIdColumn(TableName.TRIGGER_DEVICES))
            .primary()
            .notNullable();
          c.addColumn(table, SpecificDBDataTypes.MAC_ADDRESS, 'physicalAddress');
          c.addColumn(table, SpecificDBDataTypes.UINT1, 'status').notNullable();
          table.string('name', 75).unique().notNullable();
          table.string('type', 75).notNullable();
        },
      )],
      [TableName.ACTION_DEVICES, () => this._knex.schema.createTable(
        TableName.ACTION_DEVICES,
        table => {
          table.increments(getIdColumn(TableName.ACTION_DEVICES))
            .primary()
            .notNullable();
          c.addColumn(table, SpecificDBDataTypes.MAC_ADDRESS, 'physicalAddress');
          c.addColumn(table, SpecificDBDataTypes.UINT1, 'status').notNullable();
          table.string('name', 75).unique().notNullable();
          table.string('type', 75).notNullable();
          table.decimal('hourlyRate', 10, 6).notNullable();
        },
      )],
      [TableName.TRIGGER_ACTIONS, () => this._knex.schema.createTable(
        TableName.TRIGGER_ACTIONS,
        table => {
          table.increments(getIdColumn(TableName.TRIGGER_ACTIONS))
            .primary()
            .notNullable();
          const triggerDeviceId = getIdColumn(TableName.TRIGGER_DEVICES);
          table.integer(triggerDeviceId)
            .notNullable()
            .references(triggerDeviceId)
            .inTable(TableName.TRIGGER_DEVICES)
            .onDelete('CASCADE');
          const actionDeviceId = getIdColumn(TableName.ACTION_DEVICES);
          table.integer(actionDeviceId)
            .notNullable()
            .references(actionDeviceId)
            .inTable(TableName.ACTION_DEVICES)
            .onDelete('CASCADE');
        },
      )],
      [TableName.BILLS, () => this._knex.schema.createTable(
        TableName.BILLS,
        table => {
          table.increments(getIdColumn(TableName.BILLS))
            .primary()
            .notNullable();
          const triggerDeviceId = getIdColumn(TableName.TRIGGER_DEVICES);
          table.integer(triggerDeviceId)
            .notNullable()
            .references(triggerDeviceId)
            .inTable(TableName.TRIGGER_DEVICES)
            .onDelete('CASCADE');
          table.dateTime('startedAt').notNullable();
          table.dateTime('finishedAt').nullable();
          table.dateTime('sum').nullable();
        },
      )],
      [TableName.BILL_RATES, () => this._knex.schema.createTable(
        TableName.BILL_RATES,
        table => {
          table.increments(getIdColumn(TableName.BILL_RATES))
            .primary()
            .notNullable();
          const billId = getIdColumn(TableName.BILLS);
          table.integer(billId)
            .notNullable()
            .references(billId)
            .inTable(TableName.BILLS)
            .onDelete('CASCADE');
          const actionDeviceId = getIdColumn(TableName.ACTION_DEVICES);
          table.integer(actionDeviceId)
            .notNullable()
            .references(actionDeviceId)
            .inTable(TableName.ACTION_DEVICES)
            .onDelete('SET NULL');
        },
      )],
      [TableName.USER_STATISTICS, () => this._knex.schema.createTable(
        TableName.USER_STATISTICS,
        table => {
          table.increments(getIdColumn(TableName.USER_STATISTICS))
            .primary()
            .notNullable();
          const triggerDeviceId = getIdColumn(TableName.TRIGGER_DEVICES);
          table.integer(triggerDeviceId)
            .notNullable()
            .references(triggerDeviceId)
            .inTable(TableName.TRIGGER_DEVICES)
            .onDelete('CASCADE');
          table.dateTime('triggerTime').notNullable();
        },
      )],
    ]);
  }
}

let tableIdColumns: Nullable<Map<TableName, string>> = null;
export function getIdColumn(tableName: TableName): string {
  if (!tableIdColumns) {
    tableIdColumns = getTableIdColumns();
  }
  return tableIdColumns.get(tableName)!;
}
function getTableIdColumns(): Map<TableName, string> {
  return new Map([
    [TableName.USERS, 'userId'],
    [TableName.TRIGGER_DEVICES, 'triggerDeviceId'],
    [TableName.ACTION_DEVICES, 'actionDeviceId'],
    [TableName.TRIGGER_ACTIONS, 'triggerActionId'],
    [TableName.BILLS, 'billId'],
    [TableName.BILL_RATES, 'billRateId'],
    [TableName.USER_STATISTICS, 'userStatisticsId'],
  ]);
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
