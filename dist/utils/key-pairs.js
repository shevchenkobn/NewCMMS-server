"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const appRoot = require("app-root-path");
const config = require("config");
const path = require("path");
const fs_1 = require("fs");
const ts_optchain_1 = require("ts-optchain");
const yaml = require("yaml");
const logger_service_1 = require("../services/logger.service");
const yaml_1 = require("./yaml");
const util_1 = require("util");
const lib_1 = require("async-sema/lib");
const yaml_2 = require("./yaml");
let generateKeyPairAsync;
var KeyType;
(function (KeyType) {
    KeyType[KeyType["ACCESS_TOKEN"] = 0] = "ACCESS_TOKEN";
    KeyType[KeyType["REFRESH_TOKEN"] = 1] = "REFRESH_TOKEN";
})(KeyType = exports.KeyType || (exports.KeyType = {}));
async function generateRSAKeyPairFor(type, bitSize = 2048) {
    if (!generateKeyPairAsync) {
        generateKeyPairAsync = util_1.promisify(crypto_1.generateKeyPair);
    }
    return generateKeyPairAsync('rsa', {
        modulusLength: bitSize,
        privateKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
            cipher: null,
            passphrase: null,
        },
        publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
        },
    });
}
exports.generateRSAKeyPairFor = generateRSAKeyPairFor;
function saveKeysToFilesFor(type, { privateKey, publicKey }, { privateKeyPath, publicKeyPath } = getDefaultKeyPathsFor(type)) {
    return Promise.props({
        privateKey: fs_1.promises.writeFile(privateKeyPath, privateKey, 'utf8'),
        publicKey: fs_1.promises.writeFile(publicKeyPath, publicKey, 'utf8'),
    });
}
exports.saveKeysToFilesFor = saveKeysToFilesFor;
// This semaphore is needed to prevent race condition in case of two concurrent config writes
let lock = null;
// WARNING!!! Loaded Config module contents will not change!
async function saveKeysToConfigFor(type, { privateKey, publicKey }, addComments = true) {
    const localConfigName = getConfigName();
    if (!lock) {
        lock = new lib_1.Sema(1);
    }
    await lock.acquire();
    // An asserting function that will throw an error if condition is false
    await fs_1.promises.access(localConfigName, fs_1.constants.W_OK);
    const doc = await loadConfigAsYamlAst(localConfigName);
    const propName = getConfigPropertyFor(type);
    const privateKeyNode = yaml_1.getUpdatedYamlNodeOrAddNew(doc, `auth.jwt.keys.keyStrings.${propName}.private`, privateKey);
    const publicKeyNode = yaml_1.getUpdatedYamlNodeOrAddNew(doc, `auth.jwt.keys.keyStrings.${propName}.public`, publicKey);
    if (addComments) {
        const comment = `Updated from ${__filename} at ${new Date().toISOString()}`;
        yaml_2.updateYamlComment(privateKeyNode, comment);
        yaml_2.updateYamlComment(publicKeyNode, comment);
    }
    await fs_1.promises.writeFile(localConfigName, doc.toString(), 'utf8');
    lock.release();
}
exports.saveKeysToConfigFor = saveKeysToConfigFor;
async function loadKeysFor(type, keyPaths = getDefaultKeyPathsFor(type), useCachedConfig = false) {
    const keysFromFile = await loadKeysFromFilesFor(type, keyPaths);
    const keysFromConfig = await loadKeysFromConfigFor(type, useCachedConfig);
    if (!keysFromFile && !keysFromConfig) {
        throw new Error('Neither key files nor config keys are found');
    }
    if (((keysFromFile != null && keysFromFile.privateKey != null ? keysFromFile.privateKey : undefined) !== (keysFromConfig != null && keysFromConfig.privateKey != null ? keysFromConfig.privateKey : undefined))
        || ((keysFromConfig != null && keysFromConfig.publicKey != null ? keysFromConfig.publicKey : undefined) !== (keysFromConfig != null && keysFromConfig.publicKey != null ? keysFromConfig.publicKey : undefined))) {
        logger_service_1.logger.warn('Both files and config keys are present! Keys from config are taken.');
    }
    return Object.assign({}, keysFromFile, keysFromConfig);
}
exports.loadKeysFor = loadKeysFor;
async function loadKeysFromConfigFor(type, fromCache = true) {
    const propName = getConfigPropertyFor(type);
    if (fromCache) {
        // It is needed because private and public are reserved words
        const { private: pk, public: pub } = config.get(`auth.jwt.keys.keyStrings.${propName}`);
        return {
            privateKey: pk,
            publicKey: pub,
        };
    }
    const doc = await loadConfigAsYamlAst(getConfigName());
    return {
        privateKey: doc.get(`auth.jwt.keys.keyStrings.${propName}.private`),
        publicKey: doc.get(`auth.jwt.keys.keyStrings.${propName}.public`),
    };
}
exports.loadKeysFromConfigFor = loadKeysFromConfigFor;
function getConfigName() {
    const fileRegex = /local.ya?ml$/;
    return (config.util.getConfigSources()
        .find(({ name }) => fileRegex.test(name)) != null && config.util.getConfigSources()
        .find(({ name }) => fileRegex.test(name)).name != null ? config.util.getConfigSources()
        .find(({ name }) => fileRegex.test(name)).name : undefined) || appRoot.resolve('config/local.yaml');
}
async function loadConfigAsYamlAst(fileName) {
    return yaml.parseDocument(await fs_1.promises.readFile(fileName, 'utf8'));
}
function loadKeysFromFilesFor(type, { privateKeyPath, publicKeyPath } = getDefaultKeyPathsFor(type)) {
    return Promise.props({
        privateKey: fs_1.promises.readFile(privateKeyPath, 'utf8'),
        publicKey: fs_1.promises.readFile(publicKeyPath, 'utf8'),
    });
}
exports.loadKeysFromFilesFor = loadKeysFromFilesFor;
function getDefaultKeyPathsFor(type) {
    const folderPath = appRoot.resolve(config.get('auth.jwt.keys.folder'));
    const { private: privateKeyFile, public: publicKeyFile } = config
        .get(`auth.jwt.keys.filenames.${getConfigPropertyFor(type)}`);
    return {
        privateKeyPath: path.join(folderPath, privateKeyFile),
        publicKeyPath: path.join(folderPath, publicKeyFile),
    };
}
exports.getDefaultKeyPathsFor = getDefaultKeyPathsFor;
function getConfigPropertyFor(type) {
    switch (type) {
        case KeyType.ACCESS_TOKEN:
            return 'accessToken';
        case KeyType.REFRESH_TOKEN:
            return 'refreshToken';
        default:
            throw new TypeError(`Unknown key type: ${type}`);
    }
}
exports.getConfigPropertyFor = getConfigPropertyFor;
//# sourceMappingURL=key-pairs.js.map