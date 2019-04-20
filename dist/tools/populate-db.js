#!/usr/bin/node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../di/types");
const yargs = require("yargs");
const db_orchestrator_service_1 = require("../services/db-orchestrator.service");
const container_1 = require("../di/container");
const db_orchestrator_1 = require("../utils/db-orchestrator");
const argv = yargs
    .usage('Run it to create or recreate tables in database.')
    .version().alias('v', 'version')
    .option('tables', {
    alias: 't',
    array: true,
    choices: db_orchestrator_1.getTableNames,
    default: db_orchestrator_1.getTableNames,
    desc: 'Specify tables to operate.',
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
})();
//# sourceMappingURL=populate-db.js.map