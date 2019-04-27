#!/usr/bin/node

import { Nullable } from '../@types';
import * as yargs from 'yargs';
import { isPositiveInteger } from '../utils/common';
import {
  generateRSAKeyPairFor,
  IKeys,
  KeyType,
  saveKeysToConfigFor,
  saveKeysToFilesFor,
} from '../utils/key-pairs';

const generateDescription

const argv = yargs
  .usage('Run this script to generate or move key pairs, used by JWT.')
  .version().alias('v', 'version')
  .command(
    'generate',
    'Generate and save key pairs',
    yargs => yargs
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
      }),
    generate,
  )
  .command('gen')

  .demandCommand(1, 'Specify a command.')
  .help('help').alias('h', 'help')
  .strict()
  .completion()
  .recommendCommands()
  .showHelpOnFail(true)
  .argv;

generate(argv);

async function generate(args: typeof argv) {
  let accessTokenPromise: Nullable<Promise<any>> = null;
  let refreshTokenPromise: Nullable<Promise<any>> = null;
  if (!argv.noAccessTokenPair) {
    accessTokenPromise = saveKeysFor(
      args,
      KeyType.ACCESS_TOKEN,
      generateRSAKeyPairFor(
        KeyType.ACCESS_TOKEN,
        argv.accessTokenKeySize as number,
      ),
    ) as any;
  }
  if (!argv.noRefreshTokenPair) {
    refreshTokenPromise = saveKeysFor(
      args,
      KeyType.REFRESH_TOKEN,
      generateRSAKeyPairFor(
        KeyType.REFRESH_TOKEN,
        argv.refreshTokenKeySize as number,
      ),
    ) as any;
  }
  await Promise.join(accessTokenPromise, refreshTokenPromise);
}

function saveKeysFor(
  args: typeof argv,
  type: KeyType,
  promise: Promise<IKeys>,
) {
  return async () => {
    const keys = await promise;
    const savePipeline = [] as Promise<any>[];
    if (!argv.noSaveToConfig) {
      savePipeline.push(saveKeysToConfigFor(KeyType.ACCESS_TOKEN, keys));
    }
    if (!argv.noSaveToFiles) {
      savePipeline.push(
        saveKeysToFilesFor(KeyType.ACCESS_TOKEN, keys) as any,
      );
    }
    await Promise.all(savePipeline);
  };
}
