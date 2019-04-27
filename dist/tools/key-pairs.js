#!/usr/bin/node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../@types");
const yargs = require("yargs");
const common_1 = require("../utils/common");
const key_pairs_1 = require("../utils/key-pairs");
const logger_service_1 = require("../services/logger.service");
const exit_handler_service_1 = require("../services/exit-handler.service");
const tokenNames = new Map([
    [key_pairs_1.KeyType.ACCESS_TOKEN, 'access token'],
    [key_pairs_1.KeyType.REFRESH_TOKEN, 'refresh token'],
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
function getArgsForGenerate(yargs) {
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
        if (typeof argv.accessTokenSize === 'number'
            && !common_1.isPositiveInteger(argv.accessTokenSize)) {
            const optionAlias = typeof aliases['accessTokenKeyBitSize'] === 'string'
                ? aliases['accessTokenKeyBitSize']
                : aliases['accessTokenKeyBitSize'].join('" or "');
            throw new TypeError(`Option "${optionAlias}" must be a positive integer!`);
        }
        if (typeof argv.refreshTokenSize === 'number'
            && !common_1.isPositiveInteger(argv.refreshTokenSize)) {
            const optionAlias = typeof aliases['refreshTokenKeyBitSize'] === 'string'
                ? aliases['refreshTokenKeyBitSize']
                : aliases['refreshTokenKeyBitSize'].join('" or "');
            throw new TypeError(`Option "${optionAlias}" must be a positive integer!`);
        }
        return true;
    });
}
async function generateHandler(argv) {
    let accessTokenPromise = null;
    let refreshTokenPromise = null;
    if (!argv.noAccessTokenPair) {
        logger_service_1.logger.info(`Generating ${argv.accessTokenKeyBitSize}-bit sized key pair for ${tokenNames.get(key_pairs_1.KeyType.ACCESS_TOKEN)} signature...`);
        accessTokenPromise = saveKeysFor(argv, key_pairs_1.KeyType.ACCESS_TOKEN, key_pairs_1.generateRSAKeyPairFor(key_pairs_1.KeyType.ACCESS_TOKEN, argv.accessTokenKeyBitSize));
    }
    if (!argv.noRefreshTokenPair) {
        logger_service_1.logger.info(`Generating ${argv.refreshTokenKeyBitSize}-bit sized key pair for ${tokenNames.get(key_pairs_1.KeyType.REFRESH_TOKEN)} signature...`);
        refreshTokenPromise = saveKeysFor(argv, key_pairs_1.KeyType.REFRESH_TOKEN, key_pairs_1.generateRSAKeyPairFor(key_pairs_1.KeyType.REFRESH_TOKEN, argv.refreshTokenKeyBitSize));
    }
    await Promise.join(accessTokenPromise, refreshTokenPromise);
    logger_service_1.logger.info('Done. Bye! :)');
    exit_handler_service_1.exitGracefully();
}
async function saveKeysFor(argv, type, promise) {
    const tokenName = tokenNames.get(type);
    const keys = await promise;
    const savePipeline = [];
    if (!argv.noSaveToConfig) {
        logger_service_1.logger.info(`Saving key pair for ${tokenName} signature to config...`);
        savePipeline.push(key_pairs_1.saveKeysToConfigFor(type, keys, false, !argv.noUpdateComments));
    }
    if (!argv.noSaveToFiles) {
        logger_service_1.logger.info(`Saving key pair for ${tokenName} signature to files...`);
        savePipeline.push(key_pairs_1.saveKeysToFilesFor(type, keys));
    }
    await Promise.all(savePipeline);
}
function getArgsForCopyKeyPairsToConfig(yargs) {
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
async function copyKeyPairsToConfigHandler(argv) {
    if (!argv.noAccessTokenPair) {
        const tokenName = tokenNames.get(key_pairs_1.KeyType.ACCESS_TOKEN);
        logger_service_1.logger.info(`Copying key pair for ${tokenName} signature to config...`);
        const keys = await key_pairs_1.loadKeysFromFilesFor(key_pairs_1.KeyType.ACCESS_TOKEN);
        await key_pairs_1.saveKeysToConfigFor(key_pairs_1.KeyType.ACCESS_TOKEN, keys, false, !argv.noUpdateComments);
    }
    if (!argv.noRefreshTokenPair) {
        const tokenName = tokenNames.get(key_pairs_1.KeyType.REFRESH_TOKEN);
        logger_service_1.logger.info(`Copying key pair for ${tokenName} signature to config...`);
        const keys = await key_pairs_1.loadKeysFromFilesFor(key_pairs_1.KeyType.REFRESH_TOKEN);
        await key_pairs_1.saveKeysToConfigFor(key_pairs_1.KeyType.REFRESH_TOKEN, keys, false, !argv.noUpdateComments);
    }
    logger_service_1.logger.info('Done. Bye! :)');
    exit_handler_service_1.exitGracefully();
}
//# sourceMappingURL=key-pairs.js.map