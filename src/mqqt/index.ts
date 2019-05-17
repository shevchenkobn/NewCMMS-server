import { Client, connect, ConnectOptions } from 'mqttr';
import { Nullable } from '../@types';
import * as config from 'config';
import { logger } from '../services/logger.service';
import { clientId, will } from './configuration';
import { onConnect } from './controller';

let client: Nullable<Client> = null;

export interface IMqqtConfig {
  host: string;
  port: Nullable<number>;
  username: Nullable<string>;
  password: Nullable<string>;
}

export function isMqttConnected() {
  return client && client.connected;
}

export function connectMqtt(): Promise<any> {
  if (isMqttConnected()) {
    throw new TypeError('Already connected');
  }
  if (client) {
    return getConnectPromise();
  }
  initialize();
  return getConnectPromise();
}

export function getMqttClient() {
  if (!isMqttConnected()) {
    throw new TypeError('Not connected to mqtt');
  }
  return client as Client;
}

function initialize() {
  const mqttConfig = config.get<IMqqtConfig>('mqtt');
  const hasUsername = typeof mqttConfig.username === 'string';
  const hasPassword = typeof mqttConfig.password === 'string';
  if (hasPassword && !hasUsername) {
    throw new TypeError('If password is used, username is also required');
  }
  const options = {
    clientId,
    will,
    // codec: codec,
    host: mqttConfig.host,
    log: logger,
    protocol: 'mqtt',
    protocolVersion: 5,
    keepalive: 60,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    rejectUnauthorized: true,
  } as ConnectOptions;
  (options as any).properties = {
    sessionExpiryInterval: 60,
  };
  if (typeof mqttConfig.port === 'number') {
    options.port = mqttConfig.port;
  }
  if (hasUsername) {
    options.username = mqttConfig.username!;
    if (hasPassword) {
      options.password = mqttConfig.password!;
    }
  }
  client = connect();
  client.on('connect', onConnect);
}

function getConnectPromise() {
  return new Promise<any>((resolve, reject) => {
    if (!client) {
      reject(new Error('Unknown mqtt service state'));
      return;
    }
    client.once('connect', (connack: any) => {
      if (!client) {
        reject(new Error('Unknown mqtt service state'));
        return;
      }
      client.off('error', reject);
      resolve(connack);
    });
    client.once('error', reject);
  });
}
