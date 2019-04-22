#!/usr/bin/node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_orchestrator_service_1 = require("../services/db-orchestrator.service");
const logger_service_1 = require("../services/logger.service");
const db_orchestrator_1 = require("../utils/db-orchestrator");
const yargs = require("yargs");
const container_1 = require("../di/container");
const types_1 = require("../di/types");
const exit_handler_service_1 = require("../services/exit-handler.service");
if (require.main === module) {
    const argv = yargs
        .usage('Run the script to drop tables in database.')
        .version()
        .alias('v', 'version')
        .option('tables', {
        alias: 't',
        array: true,
        choices: db_orchestrator_1.getTableNames(),
        default: db_orchestrator_1.getTableNames(),
        desc: 'Specify tables to operate.',
    })
        .option('unsafe', {
        alias: 'S',
        boolean: true,
        default: false,
        description: 'Don\'t check if tables exist',
    })
        .help('help')
        .alias('h', 'help')
        .strict()
        .argv;
    (async () => {
        const dbOrchestrator = container_1.createContainer([types_1.TYPES.DbOrchestrator]).get(db_orchestrator_service_1.DbOrchestrator);
        await container_1.initDependenciesAsync();
        await dropTablesFromTheCLI(dbOrchestrator, argv.tables, !argv.unsafe);
        logger_service_1.logger.info('Done. Bye :)');
        exit_handler_service_1.gracefulExit();
    })();
}
async function dropTablesFromTheCLI(dbOrchestrator, tableNames, safe) {
    logger_service_1.logger.info(`Tables to drop: ${JSON.stringify(tableNames)}`);
    const childTables = Array.from(db_orchestrator_1.getChildTables(tableNames));
    if (childTables.length !== 0) {
        logger_service_1.logger.warn(`WARNING! Requested tables are referenced by other tables, so _additional_ tables will be dropped: ${JSON.stringify(childTables)}`);
    }
    logger_service_1.logger.info('Dropping tables...');
    await dbOrchestrator.dropTables(tableNames.concat(childTables), safe, false, (tableName, sqlQuery) => {
        logger_service_1.logger.info(`Dropped "${tableName}" with """${sqlQuery}"""`);
    });
    logger_service_1.logger.info('Tables are dropped!');
}
exports.dropTablesFromTheCLI = dropTablesFromTheCLI;
//# sourceMappingURL=db-clear.js.map