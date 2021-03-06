import * as Knex from 'knex';
import { Nullable } from '../@types';
import { DbConnection } from '../services/db-connection.class';
import { logger } from '../services/logger.service';
import { Decimal } from 'decimal.js';

// NOTE: The order is very important!
export enum TableName {
  USERS = 'users',
  TRIGGER_DEVICES = 'triggerDevices',
  ACTION_DEVICES = 'actionDevices',
  TRIGGER_ACTIONS = 'triggerActions',
  BILLS = 'bills',
  BILL_RATES = 'billRates',
  USER_TRIGGER_HISTORY = 'userTriggerHistory',
}

let tableNames: Nullable<ReadonlyArray<TableName>> = null;
export function getTableNames() {
  if (!tableNames) {
    tableNames = Object.values(TableName);
  }
  return tableNames.slice();
}

export class TableBuilders {
  private _knex: Knex;
  private _tableFactories: ReadonlyMap<TableName, () => Knex.SchemaBuilder>;
  private readonly _columnBuilders: TableColumnTypeBuilder;

  constructor(dbConnection: DbConnection) {
    this._knex = dbConnection.knex;

    let dbmsClient;
    if (typeof dbConnection.config.client === 'string') {
      dbmsClient = dbConnection.config.client;
    } else {
      // maybe other approach is needed
      const defaultDbms = 'default-sql';
      logger.warn(`The DBMS client type wasn't defined! Falling back to "${defaultDbms}"`);
      dbmsClient = defaultDbms;
    }
    // Order is important
    this._columnBuilders = TableColumnTypeBuilder.getForDbmsClient(dbmsClient);
    this._tableFactories = this.getTableFactories();
  }

  getFor(tableName: TableName) {
    return this._tableFactories.get(tableName)!();
  }

  private getTableFactories(): ReadonlyMap<
    TableName, () => Knex.SchemaBuilder
  > {
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
          c.addColumn(table, SpecificDBDataTypes.UINT1, 'role').notNullable();
          table.string('fullName', 90).notNullable();
        },
      )],
      [TableName.TRIGGER_DEVICES, () => this._knex.schema.createTable(
        TableName.TRIGGER_DEVICES,
        table => {
          table.increments(getIdColumn(TableName.TRIGGER_DEVICES))
            .primary()
            .notNullable();
          c.addColumn(table, SpecificDBDataTypes.MAC_ADDRESS, 'physicalAddress')
            .unique()
            .notNullable();
          c.addColumn(table, SpecificDBDataTypes.UINT1, 'status')
            .notNullable()
            .defaultTo(1);
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
          c.addColumn(table, SpecificDBDataTypes.MAC_ADDRESS, 'physicalAddress')
            .unique()
            .notNullable();
          c.addColumn(table, SpecificDBDataTypes.UINT1, 'status')
            .notNullable()
            .defaultTo(1);
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
          table.decimal('sum', 13, 6).nullable();
        },
      )],
      [TableName.BILL_RATES, () => this._knex.schema.createTable(
        TableName.BILL_RATES,
        table => {
//          table.increments(getIdColumn(TableName.BILL_RATES))
//            .primary()
//            .notNullable();
          const billId = getIdColumn(TableName.BILLS);
          table.integer(billId)
            .notNullable()
            .references(billId)
            .inTable(TableName.BILLS)
            .onDelete('CASCADE');
          const actionDeviceId = getIdColumn(TableName.ACTION_DEVICES);
          table.integer(actionDeviceId)
            .nullable()
            .references(actionDeviceId)
            .inTable(TableName.ACTION_DEVICES)
            .onDelete('SET NULL');
          table.decimal('hourlyRate', 10, 6).notNullable();
        },
      )],
      [TableName.USER_TRIGGER_HISTORY, () => this._knex.schema.createTable(
        TableName.USER_TRIGGER_HISTORY,
        table => {
          table.increments(getIdColumn(TableName.USER_TRIGGER_HISTORY))
            .primary()
            .notNullable();
          const userId = getIdColumn(TableName.USERS);
          table.integer(userId)
            .notNullable()
            .references(userId)
            .inTable(TableName.USERS)
            .onDelete('CASCADE');
          const triggerDeviceId = getIdColumn(TableName.TRIGGER_DEVICES);
          table.integer(triggerDeviceId)
            .notNullable()
            .references(triggerDeviceId)
            .inTable(TableName.TRIGGER_DEVICES)
            .onDelete('CASCADE');
          table.dateTime('triggerTime')
            .notNullable()
            .defaultTo((
              this._knex.fn.now as any
            )(6));
          c.addColumn(table, SpecificDBDataTypes.UINT1, 'triggerType')
            .notNullable()
            .defaultTo(0);
        },
      )],
    ]);
  }
}

let allChildTables: Nullable<
  ReadonlyMap<TableName, ReadonlyArray<TableName>>
> = null;
export function getChildTables(
  tableNames: ReadonlyArray<TableName>,
  includeOriginal = false,
) {
  if (!allChildTables) {
    allChildTables = getAllChildTables();
  }
  const queue = tableNames.slice();
  const childTables: Set<TableName> = includeOriginal
    ? new Set(tableNames)
    : new Set();
  while (queue.length > 0) {
    const tableName = queue.shift()!;
    childTables.add(tableName);
    queue.push(...allChildTables.get(tableName)!);
  }
  if (!includeOriginal) {
    for (const tableName of tableNames) {
      childTables.delete(tableName);
    }
  }
  return childTables;
}
function getAllChildTables() {
  return new Map<TableName, ReadonlyArray<TableName>>([
    [TableName.USERS, [TableName.USER_TRIGGER_HISTORY]],
    [
      TableName.TRIGGER_DEVICES,
      [
        TableName.TRIGGER_ACTIONS,
        TableName.BILLS,
        TableName.USER_TRIGGER_HISTORY,
      ],
    ],
    [
      TableName.ACTION_DEVICES,
      [TableName.TRIGGER_ACTIONS, TableName.BILL_RATES],
    ],
    [TableName.TRIGGER_ACTIONS, []],
    [TableName.BILLS, [TableName.BILL_RATES]],
    [TableName.BILL_RATES, []],
    [TableName.USER_TRIGGER_HISTORY, []],
  ]);
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
    [TableName.USER_TRIGGER_HISTORY, 'userTriggerId'],
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

export function getSaturatedBillSum<T extends number | string | Decimal>(sum: T) {
  return maxBillSum.gt(sum) ? sum : maxBillSum.toString();
}
const maxBillSum = new Decimal('9999999.999999');
