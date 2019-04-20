"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const db_connection_class_1 = require("./db-connection.class");
const db_orchestrator_1 = require("../utils/db-orchestrator");
var TableName;
(function (TableName) {
    TableName["USERS"] = "users";
    TableName["TRIGGER_DEVICES"] = "triggerDevices";
    TableName["ACTION_DEVICES"] = "actionDevices";
    TableName["TRIGGER_ACTIONS"] = "triggerActions";
    TableName["BILLS"] = "bills";
    TableName["BILL_RATES"] = "billRates";
    TableName["USER_STATISTICS"] = "userStatistics";
})(TableName = exports.TableName || (exports.TableName = {}));
let DbOrchestrator = class DbOrchestrator {
    constructor(dbConnection) {
        this._connection = dbConnection;
        this._knex = this._connection.knex;
        this._tableBuilders = null;
    }
    async createTables(newTableNames, safe = true, createTableCallback) {
        const orderedTables = newTableNames !== undefined
            ? newTableNames
            : db_orchestrator_1.getTableNames().filter(t => newTableNames.includes(t));
        if (newTableNames && orderedTables.length !== newTableNames.length) {
            throw new TypeError('Bad table names. Use `TableName` enum.');
        }
        if (!this._tableBuilders) {
            this._tableBuilders = new db_orchestrator_1.TableBuilders(this._connection);
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
                    createTableCallback(table, exists, builder.toQuery());
                }
                else {
                    createTableCallback(table, exists);
                }
            }
        }
    }
};
DbOrchestrator = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(db_connection_class_1.DbConnection)),
    tslib_1.__metadata("design:paramtypes", [db_connection_class_1.DbConnection])
], DbOrchestrator);
exports.DbOrchestrator = DbOrchestrator;
//# sourceMappingURL=db-orchestrator.service.js.map