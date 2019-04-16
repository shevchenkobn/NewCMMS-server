#!/usr/bin/node

import { TYPES } from '../di/types';
import * as yargs from 'yargs';
import {
  DbOrchestrator,
  } from '../services/db-orchestrator.service';
import { createContainer } from '../di/container';
import { getTableNames } from '../utils/db-orchestrator';

const argv = yargs
  .usage('Run it to create or recreate tables in database.')
  .version().alias('v', 'version')
  .option('tables', {
    alias: 't',
    array: true,
    choices: getTableNames as any,
    default: getTableNames,
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
  const dbOrchestrator = createContainer(
    [TYPES.DbOrchestrator],
  ).get<DbOrchestrator>(DbOrchestrator);


})();
