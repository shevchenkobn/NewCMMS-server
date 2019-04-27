import { generateKeyPair, RSAKeyPairOptions } from 'crypto';
import { Nullable } from '../@types';
import * as appRoot from 'app-root-path';
import * as importedConfig from 'config';
import * as path from 'path';
import { promises as fsPromises, constants as fsConstants } from 'fs';
import { oc } from 'ts-optchain';
import * as yaml from 'yaml';
import { from } from 'linq';
import { logger } from '../services/logger.service';
let config = importedConfig; // USE THIS CONFIG REFERENCE. It is needed for hot reload.

type GenerateKeyPairAsync = (type: 'rsa', options: RSAKeyPairOptions<'pem', 'pem'>) => Promise<IKeys>;
let generateKeyPairAsync: Nullable<GenerateKeyPairAsync>;

export enum KeyType {
  ACCESS_TOKEN, REFRESH_TOKEN,
}

export interface IKeyPaths {
  privateKeyPath: string;
  publicKeyPath: string;
}

export interface IKeys {
  publicKey: string;
  privateKey: string;
}

export interface IConfigKeyPairSpecifier {
  private: string;
  public: string;
}

export async function generateRSAKeyPairFor(
  type: KeyType,
  bitSize = 2048,
) {
  if (!generateKeyPairAsync) {
    generateKeyPairAsync = Promise
      .promisify(generateKeyPair) as unknown as GenerateKeyPairAsync;
  }
  return generateKeyPairAsync('rsa', {
    modulusLength: bitSize,
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
      cipher: null as unknown as string,
      passphrase: null as unknown as string,
    },
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
  });
}

export function saveKeysToFilesFor(
  type: KeyType,
  { privateKey, publicKey }: IKeys,
  { privateKeyPath, publicKeyPath } = getDefaultKeyPathsFor(type),
) {
  return Promise.props({
    privateKey: fsPromises.writeFile(privateKeyPath, privateKey, 'utf8'),
    publicKey: fsPromises.writeFile(publicKeyPath, publicKey, 'utf8'),
  });
}

export async function saveKeysToConfigFor(
  type: KeyType,
  { privateKey, publicKey }: IKeys,
  reloadConfig = false,
) {
  const localConfigName = getConfigName();
  // An asserting function that will throw an error if condition is false
  await fsPromises.access(
    appRoot.resolve(localConfigName),
    fsConstants.W_OK,
  );
  const doc = loadConfigAsYamlAst(localConfigName);
  const propName = getConfigPropertyFor(type);
  (doc as any).set(`auth.jwt.keys.keyStrings.${propName}.private`, privateKey);
  (doc as any).set(`auth.jwt.keys.keyStrings.${propName}.public`, publicKey);
  if (reloadConfig) {
    delete require.cache[require.resolve('config')];
    config = require('config');
  }
}

export async function loadKeysFor(
  type: KeyType,
  keyPaths = getDefaultKeyPathsFor(type),
  useCachedConfig = false,
): Promise<IKeys> {
  const keysFromFile = await loadKeysFromFilesFor(type, keyPaths);
  const keysFromConfig = await loadKeysFromConfigFor(type, useCachedConfig);
  if (!keysFromFile && !keysFromConfig) {
    throw new Error('Neither key files nor config keys are found');
  }
  if (
    (oc(keysFromFile).privateKey !== oc(keysFromConfig).privateKey)
    || (oc(keysFromConfig).publicKey !== oc(keysFromConfig).publicKey)
  ) {
    logger.warn('Both files and config keys are present! Keys from config are taken.');
  }
  return Object.assign(
    {},
    keysFromFile,
    keysFromConfig,
  ) as IKeys;
}

export async function loadKeysFromConfigFor(
  type: KeyType,
  fromCache = true,
): Promise<Partial<IKeys>> {
  const propName = getConfigPropertyFor(type);
  if (fromCache) {
    // It is needed because private and public are reserved words
    const { private: pk, public: pub } = config.get<IConfigKeyPairSpecifier>(`auth.jwt.keys.keyStrings.${propName}`);
    return {
      privateKey: pk,
      publicKey: pub,
    };
  }
  const doc = await loadConfigAsYamlAst(getConfigName());
  return {
    privateKey: (doc as any).get(`auth.jwt.keys.keyStrings.${propName}.private`),
    publicKey: (doc as any).get(`auth.jwt.keys.keyStrings.${propName}.public`),
  };
}

function getConfigName() {
  const fileRegex = /local.ya?ml$/;
  return oc(config.util.getConfigSources()
    .filter(({ name }) => name.match(fileRegex))[0]).name || appRoot.resolve('config/local.yaml');
}

async function loadConfigAsYamlAst(fileName: string) {
  return yaml.parseDocument(
    await fsPromises.readFile(fileName, 'utf8'),
  );
}

export function loadKeysFromFilesFor(
  type: KeyType,
  { privateKeyPath, publicKeyPath } = getDefaultKeyPathsFor(type),
) {
  return Promise.props({
    privateKey: fsPromises.readFile(privateKeyPath, 'utf8'),
    publicKey: fsPromises.readFile(publicKeyPath, 'utf8'),
  }) as unknown as Promise<Partial<IKeys>>;
}

export function getDefaultKeyPathsFor(type: KeyType): IKeyPaths {
  const folderPath = appRoot.resolve(config.get<string>('auth.jwt.keys.folder'));
  const { private: privateKeyFile, public: publicKeyFile } = config
    .get(`auth.jwt.keys.filenames.${getConfigPropertyFor(type)}`) as IConfigKeyPairSpecifier;
  return {
    privateKeyPath: path.join(folderPath, privateKeyFile),
    publicKeyPath: path.join(folderPath, publicKeyFile),
  };
}

export function getConfigPropertyFor(type: KeyType) {
  switch (type) {
    case KeyType.ACCESS_TOKEN:
      return 'accessToken';
    case KeyType.REFRESH_TOKEN:
      return 'refreshToken';
    default:
      throw new TypeError(`Unknown key type: ${type}`);
  }
}
