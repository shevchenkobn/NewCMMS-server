#!/usr/bin/node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../di/types");
const yargs = require("yargs");
const db_orchestrator_service_1 = require("../services/db-orchestrator.service");
const container_1 = require("../di/container");
const db_orchestrator_1 = require("../utils/db-orchestrator");
const logger_service_1 = require("../services/logger.service");
const clear_db_1 = require("./clear-db");
const argv = yargs
    .usage('Run the script to create or recreate tables in database and seed it with initial valuess.')
    .version().alias('v', 'version')
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
    .option('drop', {
    alias: 'd',
    boolean: true,
    default: false,
    description: 'Checks if tables should be dropped before recreating',
})
    .option('no-seed', {
    alias: 'S',
    boolean: true,
    default: false,
    description: 'Don\'t add minimal necessary data to database',
})
    .help('help').alias('h', 'help')
    .argv;
(async () => {
    const dbOrchestrator = container_1.createContainer([types_1.TYPES.DbOrchestrator]).get(db_orchestrator_service_1.DbOrchestrator);
    logger_service_1.logger.info(`Tables to be created: ${JSON.stringify(argv.tables)}`);
    if (argv.drop) {
        await clear_db_1.dropTablesFromTheCLI(dbOrchestrator, argv.tables, !argv.unsafe);
    }
    logger_service_1.logger.info('Creating tables...');
    await dbOrchestrator.createTables(argv.tables, !argv.unsafe, (tableName, existed, sqlQuery) => {
        if (existed) {
            logger_service_1.logger.info(`"${tableName}" already existed`);
        }
        else {
            logger_service_1.logger.info(`Created table "${tableName}" with query """${sqlQuery}"""`);
        }
    });
    logger_service_1.logger.info('Tables are created!');
    if (!argv.noSeed) {
        logger_service_1.logger.info('Seeding database...');
        await dbOrchestrator.seedDatabase();
        logger_service_1.logger.info('Database is seeded!');
    }
    logger_service_1.logger.info('Done. Bye :)');
})();
//# sourceMappingURL=populate-db.js.map