"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_orchestrator_service_1 = require("../services/db-orchestrator.service");
const logger_service_1 = require("../services/logger.service");
let tableNames = null;
function getTableNames() {
    if (!tableNames) {
        tableNames = Object.values(db_orchestrator_service_1.TableName);
    }
    return tableNames;
}
exports.getTableNames = getTableNames;
class TableBuilders {
    constructor(dbConnection) {
        this._knex = dbConnection.knex;
        this._n = (...args) => dbConnection.getIdentifier(...args);
        this._tableFactories = this.getTableFactories();
        let dbmsClient;
        if (typeof dbConnection.config.client === 'string') {
            dbmsClient = dbConnection.config.client;
        }
        else {
            // maybe other approach is needed, no info found
            const defaultDbms = 'default-sql';
            logger_service_1.logger.warn(`The DBMS client type wasn't defined! Falling back to "${defaultDbms}"`);
            dbmsClient = defaultDbms;
        }
        this._columnBuilders = TableColumnTypeBuilder.getForDbmsClient(dbmsClient);
    }
    getFor(tableName) {
        return this._tableFactories.get(tableName)();
    }
    getTableFactories() {
        const c = this._columnBuilders;
        return new Map([
            [db_orchestrator_service_1.TableName.USERS, () => this._knex.schema.createTable(db_orchestrator_service_1.TableName.USERS, table => {
                    table.increments(getIdColumn(db_orchestrator_service_1.TableName.USERS))
                        .primary()
                        .notNullable();
                    table.string('email', 90).unique().notNullable();
                    table.string('passwordHash', 60).notNullable();
                    table.string('fullName', 90).notNullable();
                })],
            [db_orchestrator_service_1.TableName.TRIGGER_DEVICES, () => this._knex.schema.createTable(db_orchestrator_service_1.TableName.TRIGGER_DEVICES, table => {
                    table.increments(getIdColumn(db_orchestrator_service_1.TableName.TRIGGER_DEVICES))
                        .primary()
                        .notNullable();
                    c.addColumn(table, 1 /* MAC_ADDRESS */, 'physicalAddress');
                    c.addColumn(table, 0 /* UINT1 */, 'status').notNullable();
                    table.string('name', 75).unique().notNullable();
                    table.string('type', 75).notNullable();
                })],
            [db_orchestrator_service_1.TableName.ACTION_DEVICES, () => this._knex.schema.createTable(db_orchestrator_service_1.TableName.ACTION_DEVICES, table => {
                    table.increments(getIdColumn(db_orchestrator_service_1.TableName.ACTION_DEVICES))
                        .primary()
                        .notNullable();
                    c.addColumn(table, 1 /* MAC_ADDRESS */, 'physicalAddress');
                    c.addColumn(table, 0 /* UINT1 */, 'status').notNullable();
                    table.string('name', 75).unique().notNullable();
                    table.string('type', 75).notNullable();
                    table.decimal('hourlyRate', 10, 6).notNullable();
                })],
            [db_orchestrator_service_1.TableName.TRIGGER_ACTIONS, () => this._knex.schema.createTable(db_orchestrator_service_1.TableName.TRIGGER_ACTIONS, table => {
                    table.increments(getIdColumn(db_orchestrator_service_1.TableName.TRIGGER_ACTIONS))
                        .primary()
                        .notNullable();
                    const triggerDeviceId = getIdColumn(db_orchestrator_service_1.TableName.TRIGGER_DEVICES);
                    table.integer(triggerDeviceId)
                        .notNullable()
                        .references(triggerDeviceId)
                        .inTable(db_orchestrator_service_1.TableName.TRIGGER_DEVICES)
                        .onDelete('CASCADE');
                    const actionDeviceId = getIdColumn(db_orchestrator_service_1.TableName.ACTION_DEVICES);
                    table.integer(actionDeviceId)
                        .notNullable()
                        .references(actionDeviceId)
                        .inTable(db_orchestrator_service_1.TableName.ACTION_DEVICES)
                        .onDelete('CASCADE');
                })],
            [db_orchestrator_service_1.TableName.BILLS, () => this._knex.schema.createTable(db_orchestrator_service_1.TableName.BILLS, table => {
                    table.increments(getIdColumn(db_orchestrator_service_1.TableName.BILLS))
                        .primary()
                        .notNullable();
                    const triggerDeviceId = getIdColumn(db_orchestrator_service_1.TableName.TRIGGER_DEVICES);
                    table.integer(triggerDeviceId)
                        .notNullable()
                        .references(triggerDeviceId)
                        .inTable(db_orchestrator_service_1.TableName.TRIGGER_DEVICES)
                        .onDelete('CASCADE');
                    table.dateTime('startedAt').notNullable();
                    table.dateTime('finishedAt').nullable();
                    table.dateTime('sum').nullable();
                })],
            [db_orchestrator_service_1.TableName.BILL_RATES, () => this._knex.schema.createTable(db_orchestrator_service_1.TableName.BILL_RATES, table => {
                    table.increments(getIdColumn(db_orchestrator_service_1.TableName.BILL_RATES))
                        .primary()
                        .notNullable();
                    const billId = getIdColumn(db_orchestrator_service_1.TableName.BILLS);
                    table.integer(billId)
                        .notNullable()
                        .references(billId)
                        .inTable(db_orchestrator_service_1.TableName.BILLS)
                        .onDelete('CASCADE');
                    const actionDeviceId = getIdColumn(db_orchestrator_service_1.TableName.ACTION_DEVICES);
                    table.integer(actionDeviceId)
                        .notNullable()
                        .references(actionDeviceId)
                        .inTable(db_orchestrator_service_1.TableName.ACTION_DEVICES)
                        .onDelete('SET NULL');
                })],
            [db_orchestrator_service_1.TableName.USER_STATISTICS, () => this._knex.schema.createTable(db_orchestrator_service_1.TableName.USER_STATISTICS, table => {
                    table.increments(getIdColumn(db_orchestrator_service_1.TableName.USER_STATISTICS))
                        .primary()
                        .notNullable();
                    const triggerDeviceId = getIdColumn(db_orchestrator_service_1.TableName.TRIGGER_DEVICES);
                    table.integer(triggerDeviceId)
                        .notNullable()
                        .references(triggerDeviceId)
                        .inTable(db_orchestrator_service_1.TableName.TRIGGER_DEVICES)
                        .onDelete('CASCADE');
                    table.dateTime('triggerTime').notNullable();
                })],
        ]);
    }
}
exports.TableBuilders = TableBuilders;
let tableIdColumns = null;
function getIdColumn(tableName) {
    if (!tableIdColumns) {
        tableIdColumns = getTableIdColumns();
    }
    return tableIdColumns.get(tableName);
}
exports.getIdColumn = getIdColumn;
function getTableIdColumns() {
    return new Map([
        [db_orchestrator_service_1.TableName.USERS, 'userId'],
        [db_orchestrator_service_1.TableName.TRIGGER_DEVICES, 'triggerDeviceId'],
        [db_orchestrator_service_1.TableName.ACTION_DEVICES, 'actionDeviceId'],
        [db_orchestrator_service_1.TableName.TRIGGER_ACTIONS, 'triggerActionId'],
        [db_orchestrator_service_1.TableName.BILLS, 'billId'],
        [db_orchestrator_service_1.TableName.BILL_RATES, 'billRateId'],
        [db_orchestrator_service_1.TableName.USER_STATISTICS, 'userStatisticsId'],
    ]);
}
var SpecificDBDataTypes;
(function (SpecificDBDataTypes) {
    SpecificDBDataTypes[SpecificDBDataTypes["UINT1"] = 0] = "UINT1";
    SpecificDBDataTypes[SpecificDBDataTypes["MAC_ADDRESS"] = 1] = "MAC_ADDRESS";
})(SpecificDBDataTypes || (SpecificDBDataTypes = {}));
class TableColumnTypeBuilder {
    constructor(dbmsClient) {
        this._dbmsClient = dbmsClient;
        this._columnFactories = this.getColumnFactories();
    }
    static getForDbmsClient(dbmsClient) {
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
    addColumn(table, type, name) {
        return this._columnFactories.get(type)(table, name);
    }
    getColumnFactories() {
        switch (this._dbmsClient) {
            case 'pg':
                return new Map([
                    [
                        0 /* UINT1 */,
                        (table, name) => table.specificType(name, 'SMALLINT'),
                    ],
                    [
                        1 /* MAC_ADDRESS */,
                        (table, name) => table.specificType(name, 'macaddr'),
                    ],
                ]);
            default:
                logger_service_1.logger.warn(`Specific types for "${this._dbmsClient}" are not supported!`);
                return new Map([
                    [
                        0 /* UINT1 */,
                        (table, name) => table.integer(name),
                    ],
                    [
                        1 /* MAC_ADDRESS */,
                        (table, name) => table.string(name, 12),
                    ],
                ]);
        }
    }
}
TableColumnTypeBuilder._cache = null;
//# sourceMappingURL=db-orchestrator.js.map