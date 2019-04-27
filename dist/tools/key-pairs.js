#!/usr/bin/node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../@types");
const yargs = require("yargs");
const common_1 = require("../utils/common");
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
        const optionAlias = typeof aliases['accessTokenSize'] === 'string'
            ? aliases['accessTokenSize']
            : aliases['accessTokenSize'].join('" or "');
        throw new TypeError(`Option "${optionAlias}" must be a positive integer!`);
    }
    if (typeof argv.refreshTokenSize === 'number'
        && !common_1.isPositiveInteger(argv.refreshTokenSize)) {
        const optionAlias = typeof aliases['refreshTokenSize'] === 'string'
            ? aliases['refreshTokenSize']
            : aliases['refreshTokenSize'].join('" or "');
        throw new TypeError(`Option "${optionAlias}" must be a positive integer!`);
    }
    return true;
})
    .help('help').alias('h', 'help')
    .strict()
    .completion()
    .recommendCommands()
    .showHelpOnFail(true)
    .argv;
(async () => {
    console.log(argv);
})();
//# sourceMappingURL=key-pairs.js.map