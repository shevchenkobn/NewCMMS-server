import { DbOrchestrator, TableName } from '../services/db-orchestrator.service';
import { logger } from '../services/logger.service';
import { getChildTables, getTableNames } from '../utils/db-orchestrator';
import * as yargs from 'yargs';
import { createContainer, getContainer } from '../di/container';
import { TYPES } from '../di/types';

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
    .argv;

  (
    async () => {
      await dropTablesFromTheCLI(
        createContainer([TYPES.DbOrchestrator])
          .get<DbOrchestrator>(DbOrchestrator),
        argv.tables,
        !argv.unsafe,
      );
      logger.info('Done. Bye :)');
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
