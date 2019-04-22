#!/usr/bin/node

import '../@types';
import { TYPES } from '../di/types';
import * as yargs from 'yargs';
import { logger } from '../services/logger.service';
import { gracefulExit } from '../services/exit-handler.service';

const argv = yargs
  .usage('Run this script to generate key pair, used by JWT.')
  .version().alias('v', 'version')
  .option('access-token-size', {
    alias: 'a',
    type: 'number',
    default: 2048,
    description: 'Size in bits of RSA key for access token signature.',
  })
  .option('no-access-token-pair', {
    alias: 'A',
    type: 'boolean',
    default: false,
    description: 'Don\'t generate RSA key for access token signature.',
  })
  .option('refresh-token-size', {
    alias: 'r',
    type: 'number',
    default: 2048,
    description: 'Size in bits of RSA key for refresh token signature.',
  })
  .option('no-refresh-token-pair', {
    alias: 'R',
    type: 'boolean',
    default: false,
    description: 'Don\'t generate RSA key for refresh token signature.',
  })
  .help('help').alias('h', 'help')
  .strict()
  .argv;


