import { generateKeyPair, RSAKeyPairOptions } from 'crypto';
import { Nullable } from '../@types';

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

export function generateRSAKeyPair(type: KeyType, bitSize = 2048) {
  if (!generateKeyPairAsync) {
    generateKeyPairAsync = Promise
      .promisify(generateKeyPair) as unknown as GenerateKeyPairAsync;
  }
  return generateKeyPairAsync('rsa', {
    modulusLength: bitSize,
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    } as any,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
  });
}
