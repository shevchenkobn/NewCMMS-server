"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const db_connection_class_1 = require("./db-connection.class");
const db_orchestrator_1 = require("../utils/db-orchestrator");
const config = require("config");
const users_model_1 = require("../models/users.model");
// NOTE: The order is very important!
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
    constructor(dbConnection, usersModel) {
        this._connection = dbConnection;
        this._usersModel = usersModel;
        this._knex = this._connection.knex;
        this._tableBuilders = null;
    }
    async dropTables(tableNames, safe = true, resolveChildTables = true, dropTableCallback) {
        let orderedTables = tableNames !== undefined
            ? db_orchestrator_1.getTableNames().filter(t => tableNames.includes(t))
            : db_orchestrator_1.getTableNames();
        if (tableNames && orderedTables.length !== tableNames.length) {
            throw new TypeError('Bad table names. Use `TableName` enum.');
        }
        if (resolveChildTables && orderedTables.length < db_orchestrator_1.getTableNames().length) {
            orderedTables = Array.from(db_orchestrator_1.getChildTables(orderedTables));
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
    async createTables(tableNames, safe = true, createTableCallback) {
        const orderedTables = tableNames !== undefined
            ? db_orchestrator_1.getTableNames().filter(t => tableNames.includes(t))
            : db_orchestrator_1.getTableNames();
        if (tableNames && orderedTables.length !== tableNames.length) {
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
                    createTableCallback(table, exists);
                }
                else {
                    createTableCallback(table, exists, builder.toQuery());
                }
            }
        }
    }
    clearDatabaseSeed() {
        const email = config.get('server.admin.email');
        // TODO: replace with more relevant model method
        return this._usersModel.table.where('email', email).delete();
    }
    seedDatabase() {
        const { id, name, email, password } = config.get('server.admin');
        const admin = {
            email,
            password,
            role: users_model_1.UserRole.ADMIN,
            fullName: name,
        };
        // Doing a slight hack to preserve super admin id
        if (typeof id === 'number') {
            admin.userId = id;
        }
        return this._usersModel.create(admin);
    }
};
DbOrchestrator = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(db_connection_class_1.DbConnection)),
    tslib_1.__param(1, inversify_1.inject(users_model_1.UsersModel)),
    tslib_1.__metadata("design:paramtypes", [db_connection_class_1.DbConnection,
        users_model_1.UsersModel])
], DbOrchestrator);
exports.DbOrchestrator = DbOrchestrator;
exports.superAdminId = config.get('server.admin.id');
//# sourceMappingURL=db-orchestrator.service.js.map