"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("../di/types");
const inversify_1 = require("inversify");
const config = require("config");
const Knex = require("knex");
const exit_handler_service_1 = require("./exit-handler.service");
const logger_service_1 = require("./logger.service");
const Enumerable = require("linq");
let DbConnection = class DbConnection {
    constructor(dbConfig = config.get('db')) {
        const dbTypeChoices = Object.keys(dbConfig);
        if (dbTypeChoices.length === 0) {
            throw new TypeError('No DB configs found! Check your configs to correct the issue.');
        }
        const dbTypePriority = ['pg', 'mysql', 'mssql'];
        let client = null;
        if (dbTypeChoices.length === 1) {
            if (!dbTypePriority.includes(dbTypeChoices[0])) {
                throw new TypeError(`The database type "${dbTypeChoices[0]}" is not supported! Check your configs to correct the issue.`);
            }
            client = dbTypeChoices[0];
        }
        else {
            client = Enumerable.from(dbTypePriority).first(type => type in dbConfig);
            if (!client) {
                throw new TypeError('No supported DB types! Check your configs to correct the issue.');
            }
            logger_service_1.logger.warn(`Several DB configs found. The DB "${client}" is selected according to priority ${JSON.stringify(dbTypePriority)}.`);
        }
        this.config = {
            client,
            connection: dbConfig,
        };
        this.knex = Knex(this.config);
        exit_handler_service_1.bindOnExitHandler(() => {
            logger_service_1.logger.info(`Closing database connection for "${this.config.client}" at ${this.config.connection.host} to ${this.config.connection.database}`);
            this.knex.destroy(() => logger_service_1.logger.info(`Closed database connection for "${this.config.client}" at ${this.config.connection.host} to ${this.config.connection.database}`));
        });
    }
    getIdentifier(...args) {
        return this.knex.raw(`??${'.??'.repeat(args.length - 1)}`, args);
    }
};
DbConnection = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__metadata("design:paramtypes", [Object])
], DbConnection);
exports.DbConnection = DbConnection;
//# sourceMappingURL=db-connection.class.js.map