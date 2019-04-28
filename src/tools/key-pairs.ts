#!/usr/bin/node

import '../@types';
// It is needed to avoid TS compiler tree shaking with only-type imports
// tslint:disable-next-line:no-duplicate-imports
import { Nullable } from '../@types';
import * as yargs from 'yargs';
import { isPositiveInteger } from '../utils/common';
import {
  generateRSAKeyPairFor,
  IKeys,
  KeyType,
  loadKeysFromFilesFor,
  saveKeysToConfigFor,
  saveKeysToFilesFor,
} from '../utils/key-pairs';
import { logger } from '../services/logger.service';
import { exitGracefully } from '../services/exit-handler.service';

const tokenNames = new Map<KeyType, string>([
  [KeyType.ACCESS_TOKEN, 'access token'],
  [KeyType.REFRESH_TOKEN, 'refresh token'],
]);

yargs
  .usage('Run this script to generate or move key pairs, used by JWT.')
  .version().alias('v', 'version')
  .command({
    command: 'generate',
    aliases: ['gen', 'g'],
    describe: 'Generate and save key pairs.',
    builder: getArgsForGenerate,
    handler: generateHandler,
  })
  .command({
    command: 'copy-to-config',
    aliases: ['copy', 'c'],
    describe: 'Copy key pairs to config file from separate files.',
    builder: getArgsForCopyKeyPairsToConfig,
    handler: copyKeyPairsToConfigHandler,
  })
  .demandCommand(1, 'Specify a command.')
  .help('help').alias('h', 'help')
  .strict()
  .completion()
  .recommendCommands()
  .showHelpOnFail(true)
  .parse();

function getArgsForGenerate<T>(yargs: yargs.Argv<T>) {
  return yargs
    .option('access-token-key-bit-size', {
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
      conflicts: 'access-token-key-bit-size',
    })
    .option('refresh-token-key-bit-size', {
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
      conflicts: 'refresh-token-key-bit-size',
    })
    .option('no-save-to-files', {
      alias: 'F',
      type: 'boolean',
      description: 'Don\'t save generated keys to files.',
    })
    .option('no-save-to-config', {
      alias: 'C',
      type: 'boolean',
      description: 'Don\'t save to local.yaml config file.',
    })
    .conflicts('no-save-to-files', 'no-save-to-config')
    .option('no-update-comments', {
      alias: 'U',
      type: 'boolean',
      description: 'Don\'t append comments about update when writing to local.yaml file.',
      conflicts: 'no-save-to-config',
    })
    .check((argv, aliases) => {
      if (
        typeof argv.accessTokenSize === 'number'
        && !isPositiveInteger(argv.accessTokenSize)
      ) {
        const optionAlias = typeof aliases['accessTokenKeyBitSize'] === 'string'
          ? aliases['accessTokenKeyBitSize']
          : (aliases['accessTokenKeyBitSize'] as unknown as ReadonlyArray<string>).join('" or "');
        throw new TypeError(`Option "${optionAlias}" must be a positive integer!`);
      }
      if (
        typeof argv.refreshTokenSize === 'number'
        && !isPositiveInteger(argv.refreshTokenSize)
      ) {
        const optionAlias = typeof aliases['refreshTokenKeyBitSize'] === 'string'
          ? aliases['refreshTokenKeyBitSize']
          : (aliases['refreshTokenKeyBitSize'] as unknown as ReadonlyArray<string>).join('" or "');
        throw new TypeError(`Option "${optionAlias}" must be a positive integer!`);
      }
      return true;
    });
}

async function generateHandler<T>(argv: yargs.Arguments<T>) {
  let accessTokenPromise: Nullable<Promise<any>> = null;
  let refreshTokenPromise: Nullable<Promise<any>> = null;
  if (!argv.noAccessTokenPair) {
    logger.info(`Generating ${argv.accessTokenKeyBitSize}-bit sized key pair for ${tokenNames.get(KeyType.ACCESS_TOKEN)} signature...`);
    accessTokenPromise = saveKeysFor(
      argv,
      KeyType.ACCESS_TOKEN,
      generateRSAKeyPairFor(
        KeyType.ACCESS_TOKEN,
        argv.accessTokenKeyBitSize as number,
      ),
    ) as any;
  }
  if (!argv.noRefreshTokenPair) {
    logger.info(`Generating ${argv.refreshTokenKeyBitSize}-bit sized key pair for ${tokenNames.get(KeyType.REFRESH_TOKEN)} signature...`);
    refreshTokenPromise = saveKeysFor(
      argv,
      KeyType.REFRESH_TOKEN,
      generateRSAKeyPairFor(
        KeyType.REFRESH_TOKEN,
        argv.refreshTokenKeyBitSize as number,
      ),
    ) as any;
  }
  await Promise.join(accessTokenPromise, refreshTokenPromise);
  logger.info('Done. Bye! :)');
  exitGracefully();
}

async function saveKeysFor<T>(
  argv: yargs.Arguments<T>,
  type: KeyType,
  promise: Promise<IKeys>,
) {
  const tokenName = tokenNames.get(type);
  const keys = await promise;
  const savePipeline = [] as Promise<any>[];
  if (!argv.noSaveToConfig) {
    logger.info(`Saving key pair for ${tokenName} signature to config...`);
    savePipeline.push(saveKeysToConfigFor(
      type,
      keys,
      !argv.noUpdateComments,
    ));
  }
  if (!argv.noSaveToFiles) {
    logger.info(`Saving key pair for ${tokenName} signature to files...`);
    savePipeline.push(
      saveKeysToFilesFor(type, keys) as any,
    );
  }
  await Promise.all(savePipeline);
}

function getArgsForCopyKeyPairsToConfig<T>(yargs: yargs.Argv<T>) {
  return yargs
    .option('no-access-token-pair', {
      alias: 'A',
      type: 'boolean',
      // default: false,
      description: 'Don\'t copy key pair for access token signature.',
    })
    .option('no-refresh-token-pair', {
      alias: 'A',
      type: 'boolean',
      // default: false,
      description: 'Don\'t copy key pair for refresh token signature.',
    })
    .conflicts('no-access-token-pair', 'no-refresh-token-pair')
    .option('no-update-comments', {
      alias: 'U',
      type: 'boolean',
      description: 'Don\'t append comments about update when writing to local.yaml file.',
    });
}

async function copyKeyPairsToConfigHandler<T>(argv: yargs.Arguments<T>) {
  if (!argv.noAccessTokenPair) {
    const tokenName = tokenNames.get(KeyType.ACCESS_TOKEN);
    logger.info(`Copying key pair for ${tokenName} signature to config...`);
    const keys = await loadKeysFromFilesFor(KeyType.ACCESS_TOKEN);
    await saveKeysToConfigFor(
      KeyType.ACCESS_TOKEN,
      keys,
      !argv.noUpdateComments,
    );
  }
  if (!argv.noRefreshTokenPair) {
    const tokenName = tokenNames.get(KeyType.REFRESH_TOKEN);
    logger.info(`Copying key pair for ${tokenName} signature to config...`);
    const keys = await loadKeysFromFilesFor(KeyType.REFRESH_TOKEN);
    await saveKeysToConfigFor(
      KeyType.REFRESH_TOKEN,
      keys,
      !argv.noUpdateComments,
    );
  }
  logger.info('Done. Bye! :)');
  exitGracefully();
}
