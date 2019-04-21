#!/usr/bin/node

import { TYPES } from '../di/types';
import * as yargs from 'yargs';
import {
  DbOrchestrator, TableName,
} from '../services/db-orchestrator.service';
import { createContainer } from '../di/container';
import { getTableNames } from '../utils/db-orchestrator';
import { logger } from '../services/logger.service';
import { dropTablesFromTheCLI } from './clear-db';

const argv = yargs
  .usage('Run the script to create or recreate tables in database and seed it with initial valuess.')
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
  .help('help').alias('h', 'help')
  .argv;

(async () => {
  const dbOrchestrator = createContainer(
    [TYPES.DbOrchestrator],
  ).get<DbOrchestrator>(DbOrchestrator);

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

  if (!argv.noSeed) {
    logger.info('Seeding database...');
    await dbOrchestrator.seedDatabase();
    logger.info('Database is seeded!');
  }

  logger.info('Done. Bye :)');
})();
