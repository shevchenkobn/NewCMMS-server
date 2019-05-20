import { connect, AsyncMqttClient, IClientOptions } from 'async-mqtt';
import { Nullable } from '../@types';
import { bindOnExitHandler } from '../services/exit-handler.service';
import { logger } from '../services/logger.service';
import { clientId, mqttConfig, will } from './configuration';
import { onConnect } from './controller';

let client: Nullable<AsyncMqttClient> = null;

export interface IMqttConfig {
  broker: {
    protocol: 'mqtt';
    host: string;
    port: Nullable<number>;
    username: Nullable<string>;
    password: Nullable<string>;
  };
  clusterMode: boolean;
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
  return client as AsyncMqttClient;
}

function initialize() {
  const hasUsername = typeof mqttConfig.broker.username === 'string';
  const hasPassword = typeof mqttConfig.broker.password === 'string';
  if (hasPassword && !hasUsername) {
    throw new TypeError('If password is used, username is also required');
  }
  const url = `${mqttConfig.broker.protocol}://${mqttConfig.broker.host}:${mqttConfig.broker.port || 1883}`;
  const options = {
    clientId,
    will,
    protocolVersion: 4, // BUG: does not accept 5
    keepalive: 60,
    reconnectPeriod: 0,
    connectTimeout: 30 * 1000,
    rejectUnauthorized: true,
    resubscribe: true, // FIXME: whether needed
  } as IClientOptions;
  (options as any).properties = {
    sessionExpiryInterval: 60,
  };
  if (hasUsername) {
    options.username = mqttConfig.broker.username!;
    if (hasPassword) {
      options.password = mqttConfig.broker.password!;
    }
  }
  logger.info(`Connecting to mqtt at "${url}"...`);
  client = connect(
    url,
    options,
  );

  client.on('connect', (connack: any) => {
    logger.info('Connected to mqtt.');
    onConnect(connack);
  });
  client.on('close', () => logger.info('Disconnected from mqtt.'));
  client.on('reconnect', () => logger.info('Reconnecting to mqtt...'));
  bindOnExitHandler(() => {
    if (!client) {
      throw new Error('Unknown mqtt service state');
    }
    logger.info('Disconnecting from mqtt...');
    client.end(false);
  }, true);
}

function getConnectPromise() {
  return new Promise<any>((resolve, reject) => {
    if (!client) {
      reject(new Error('Unknown mqtt service state'));
      return;
    }
    const errCb = (err: any) => {
      reject(err);
    };
    client.once('connect', (connack: any) => {
      if (!client) {
        reject(new Error('Unknown mqtt service state'));
        return;
      }
      client.off('error', errCb);
      resolve(connack);
    });
    client.once('error', errCb);
  });
}
