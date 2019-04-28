"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("../di/types");
const inversify_1 = require("inversify");
const config = require("config");
const Knex = require("knex");
const exit_handler_service_1 = require("./exit-handler.service");
const logger_service_1 = require("./logger.service");
exports.availableDbTypes = [
    'pg', 'mssql', 'mssql', 'oracle',
];
let DbConnection = class DbConnection {
    constructor(dbConfig = config.get('db')) {
        if (!exports.availableDbTypes.includes(dbConfig.type)) {
            throw new TypeError(`The database type "${dbConfig.type}" is not supported! Available DB types: ${JSON.stringify(exports.availableDbTypes)}. Check your configs to correct the issue.`);
        }
        const { type: client, ...connectionConfig } = dbConfig;
        // A stub condition to be changed in future
        if (client !== 'pg') {
            throw new TypeError('Postgres only supported by now');
        }
        this.config = {
            client,
            connection: connectionConfig,
        };
        this.knex = Knex(this.config);
        exit_handler_service_1.bindOnExitHandler(() => {
            logger_service_1.logger.info(`Closing database connection for "${this.config.client}" at ${this.config.connection.host} to ${this.config.connection.database}`);
            this.knex.destroy(() => logger_service_1.logger.info(`Closed database connection for "${this.config.client}" at ${this.config.connection.host} to ${this.config.connection.database}`));
        });
    }
    getIdentifier(...args) {
        return this.knex.raw(`??${'.??'.repeat(args.length - 1)}`, args.slice());
    }
};
DbConnection = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__metadata("design:paramtypes", [Object])
], DbConnection);
exports.DbConnection = DbConnection;
//# sourceMappingURL=db-connection.class.js.map