#!/usr/bin/node

import '../@types';
import { TYPES } from '../di/types';
import { exitGracefully } from '../services/exit-handler.service';
import * as yargs from 'yargs';
import {
  DbOrchestrator, } from '../services/db-orchestrator.class';
import { createContainer, initDependenciesAsync } from '../di/container';
import { getTableNames, TableName } from '../utils/db-orchestrator';
import { logger } from '../services/logger.service';
import { dropTablesFromTheCLI } from './db-clear';

const argv = yargs
  .usage('Run the script to create or recreate tables in database and seed it with initial values.')
  .version().alias('v', 'version')
  .option('tables', {
    alias: 't',
    array: true,
    choices: getTableNames(),
    default: getTableNames(),
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
  .option('clear-seed', {
    alias: 'c',
    boolean: true,
    default: false,
    description: 'Delete seeded values',
  })
  .help('help').alias('h', 'help')
  .strict()
  .completion()
  .recommendCommands()
  .showHelpOnFail(true)
  .argv;

(async () => {
  const dbOrchestrator = createContainer(
    [TYPES.DbOrchestrator],
  ).get<DbOrchestrator>(DbOrchestrator);
  await initDependenciesAsync();

  logger.info(`Tables to be created: ${JSON.stringify(argv.tables)}`);
  if (argv.drop) {
    await dropTablesFromTheCLI(dbOrchestrator, argv.tables, !argv.unsafe);
  }
  logger.info('Creating tables...');
  await dbOrchestrator.createTables(
    argv.tables,
    !argv.unsafe,
    (tableName: TableName, existed: boolean, sqlQuery?: string) => {
      if (existed) {
        logger.info(`"${tableName}" already existed`);
      } else {
        logger.info(`Created table "${tableName}" with query """${sqlQuery}"""`);
      }
    },
  );
  logger.info('Tables are created!');

  if (argv.clearSeed) {
    logger.info('Deleting database seed values...');
    await dbOrchestrator.clearDatabaseSeed();
    logger.info('Database seed values are deleted!');
  }
  if (!argv.noSeed) {
    logger.info('Seeding database...');
    await dbOrchestrator.seedDatabase();
    logger.info('Database is seeded!');
  }

  logger.info('Done. Bye :)');
  exitGracefully();
})();
