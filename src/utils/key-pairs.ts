import { generateKeyPair, RSAKeyPairOptions } from 'crypto';
import { Nullable, NullablePartial, Optional } from '../@types';
import * as appRoot from 'app-root-path';
import * as config from 'config';
import * as path from 'path';
import { constants as fsConstants, promises as fsPromises } from 'fs';
import { oc } from 'ts-optchain';
import * as yaml from 'yaml';
import { logger } from '../services/logger.service';
import {
  updateYamlComment,
  getUpdatedYamlNodeOrAddNew,
  getYamlNodeAt, getYamlValueAt,
} from './yaml';
import { promisify } from 'util';
import { Sema } from 'async-sema/lib';
import { getJwtConfig } from './auth';

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

export interface IConfigKeyPairDescriptor {
  private: string;
  public: string;
}

export async function generateRSAKeyPairFor(
  type: KeyType,
  bitSize = 2048,
): Promise<IKeys> {
  if (!generateKeyPairAsync) {
    generateKeyPairAsync = promisify(generateKeyPair) as
      unknown as GenerateKeyPairAsync;
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
// This semaphore is needed to prevent race condition in case of two concurrent config writes
let lock: Nullable<Sema> = null;
// WARNING!!! Loaded Config module contents will not change!
export async function saveKeysToConfigFor(
  type: KeyType,
  { privateKey, publicKey }: IKeys,
  addComments = true,
) {
  const localConfigName = getConfigName();
  if (!lock) {
    lock = new Sema(1, { capacity: 2 });
  }
  await lock.acquire();
  // An asserting function that will throw an error if condition is false
  await fsPromises.access(
    localConfigName,
    fsConstants.W_OK,
  );
  const doc = await loadConfigAsYamlAst(localConfigName) as any;
  const propName = getConfigPropertyFor(type);
  const privateKeyNode = getUpdatedYamlNodeOrAddNew(
    doc,
    `auth.jwt.keys.keyStrings.${propName}.private`,
    privateKey,
  );
  const publicKeyNode = getUpdatedYamlNodeOrAddNew(
    doc,
    `auth.jwt.keys.keyStrings.${propName}.public`,
    publicKey,
  );
  if (addComments) {
    const comment = `Updated from ${__filename} at ${new Date().toISOString()}`;
    updateYamlComment(privateKeyNode, comment);
    updateYamlComment(publicKeyNode, comment);
  }
  await fsPromises.writeFile(localConfigName, doc.toString(), 'utf8');
  lock.release();
}

export async function loadKeys(
  keyPaths = getDefaultKeyPaths(),
  useCachedConfig = false,
) {
  return Promise.props({
    accessToken: loadKeysFor(
      KeyType.ACCESS_TOKEN,
      keyPaths.accessToken,
      useCachedConfig,
    ),
    refreshToken: loadKeysFor(
      KeyType.REFRESH_TOKEN,
      keyPaths.refreshToken,
      useCachedConfig,
    ),
  });
}

export async function loadKeysFor(
  type: KeyType,
  keyPaths = getDefaultKeyPathsFor(type),
  useCachedConfig = false,
): Promise<IKeys> {
  const keysFromFile = await loadKeysFromFilesFor(type, keyPaths);
  const keysFromConfig = await loadKeysFromConfigFor(type, useCachedConfig);
  if ((
    !oc(keysFromFile).privateKey && !oc(keysFromFile).publicKey
  ) && (
    !oc(keysFromConfig).privateKey && !oc(keysFromConfig).publicKey
  )) {
    throw new Error('Neither key files nor config keys are found');
  }
  if (
    (
      oc(keysFromFile).privateKey
      && oc(keysFromConfig).privateKey
      && oc(keysFromFile).privateKey !== oc(keysFromConfig).privateKey
    ) || (
      oc(keysFromConfig).publicKey
      && oc(keysFromConfig).publicKey
      && oc(keysFromConfig).publicKey !== oc(keysFromConfig).publicKey
    )
  ) {
    logger.warn('Both files and config keys are present! They are different, so keys from config are taken.');
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
): Promise<NullablePartial<IKeys>> {
  const propName = getConfigPropertyFor(type);
  if (fromCache) {
    // It is needed because private and public are reserved words
    const { private: pk, public: pub } = oc(getJwtConfig().keys)
      .keyStrings[propName];
    return {
      privateKey: pk as any,
      publicKey: pub as any,
    };
  }
  const doc = await loadConfigAsYamlAst(getConfigName()) as any;
  return {
    privateKey: getYamlValueAt<string>(
      doc,
      `auth.jwt.keys.keyStrings.${propName}.private`,
    ),
    publicKey: getYamlValueAt<string>(
      doc,
      `auth.jwt.keys.keyStrings.${propName}.public`,
    ),
  };
}

function getConfigName() {
  const fileRegex = /local\.ya?ml$/;
  return oc(config.util.getConfigSources()
    .find(({ name }) => fileRegex.test(name))).name || appRoot.resolve('config/local.yaml');
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
  }) as unknown as Promise<IKeys>;
}

export function getDefaultKeyPaths() {
  return {
    accessToken: getDefaultKeyPathsFor(KeyType.ACCESS_TOKEN),
    refreshToken: getDefaultKeyPathsFor(KeyType.REFRESH_TOKEN),
  };
}

export function getDefaultKeyPathsFor(type: KeyType): IKeyPaths {
  const folderPath = appRoot.resolve(getJwtConfig().keys.folder);
  const { private: privateKeyFile, public: publicKeyFile } = config
    .get(`auth.jwt.keys.filenames.${getConfigPropertyFor(type)}`) as IConfigKeyPairDescriptor;
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
