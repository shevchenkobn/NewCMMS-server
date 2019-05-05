#!/usr/bin/node

import '../@types';
import { TYPES } from '../di/types';
import { exitGracefully } from '../services/exit-handler.service';
import { DbOrchestrator } from '../services/db-orchestrator.class';
import { logger } from '../services/logger.service';
import {
  getChildTables,
  getTableNames,
  TableName,
} from '../utils/db-orchestrator';
import * as yargs from 'yargs';
import {
  createContainer,
  initDependenciesAsync,
} from '../di/container';

if (require.main === module) {
  const argv = yargs
    .usage('Run the script to drop tables in database.')
    .version()
    .alias('v', 'version')
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
    .help('help')
    .alias('h', 'help')
    .strict()
    .completion()
    .recommendCommands()
    .showHelpOnFail(true)
    .argv;

  (
    async () => {
      const dbOrchestrator = createContainer(
        [TYPES.DbOrchestrator],
      ).get<DbOrchestrator>(DbOrchestrator);
      await initDependenciesAsync();
      await dropTablesFromTheCLI(
        dbOrchestrator,
        argv.tables,
        !argv.unsafe,
      );
      logger.info('Done. Bye :)');
      exitGracefully();
    }
  )();
}

export async function dropTablesFromTheCLI(
  dbOrchestrator: DbOrchestrator,
  tableNames: ReadonlyArray<TableName>,
  safe: boolean,
) {
  logger.info(`Tables to drop: ${JSON.stringify(tableNames)}`);
  const childTables = Array.from(getChildTables(tableNames));
  if (childTables.length !== 0) {
    logger.warn(`WARNING! Requested tables are referenced by other tables, so _additional_ tables will be dropped: ${JSON.stringify(childTables)}`);
  }
  logger.info('Dropping tables...');
  await dbOrchestrator.dropTables(
    tableNames.concat(childTables),
    safe,
    false,
    (tableName, sqlQuery) => {
      logger.info(`Dropped "${tableName}" with """${sqlQuery}"""`);
    },
  );
  logger.info('Tables are dropped!');
}
