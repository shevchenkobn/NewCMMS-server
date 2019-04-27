#!/usr/bin/node

import '../@types';
import { TYPES } from '../di/types';
import { exitGracefully } from '../services/exit-handler.service';
import * as yargs from 'yargs';
import { logger } from '../services/logger.service';
import { isPositiveInteger } from '../utils/common';

const argv = yargs
  .usage('Run this script to generate or move key pairs, used by JWT.')
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
    // default: false,
    description: 'Don\'t generate RSA key for access token signature.',
    conflicts: 'access-token-size',
  })
  .option('refresh-token-size', {
    alias: 'r',
    type: 'number',
    default: 4096,
    description: 'Size in bits of RSA key for refresh token signature.',
  })
  .option('no-refresh-token-pair', {
    alias: 'R',
    type: 'boolean',
    // default: false,
    description: 'Don\'t generate RSA key for refresh token signature.',
    conflicts: 'refresh-token-size',
  })
  .check((argv, aliases) => {
    if (
      typeof argv.accessTokenSize === 'number'
      && !isPositiveInteger(argv.accessTokenSize)
    ) {
      const optionAlias = typeof aliases['accessTokenSize'] === 'string'
        ? aliases['accessTokenSize']
        : (aliases['accessTokenSize'] as unknown as ReadonlyArray<string>).join('" or "');
      throw new TypeError(`Option "${optionAlias}" must be a positive integer!`);
    }
    if (
      typeof argv.refreshTokenSize === 'number'
      && !isPositiveInteger(argv.refreshTokenSize)
    ) {
      const optionAlias = typeof aliases['refreshTokenSize'] === 'string'
        ? aliases['refreshTokenSize']
        : (aliases['refreshTokenSize'] as unknown as ReadonlyArray<string>).join('" or "');
      throw new TypeError(`Option "${optionAlias}" must be a positive integer!`);
    }
  })
  .help('help').alias('h', 'help')
  .strict()
  .completion()
  .recommendCommands()
  .showHelpOnFail(true)
  .argv;

console.log(argv);
