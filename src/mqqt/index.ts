import { Client, connect, ConnectOptions } from 'mqttr';
import { Nullable } from '../@types';
import * as config from 'config';
import { clientId, codec, will } from './configuration';

let client: Nullable<Client> = null;

export interface IMqqtConfig {
  host: string;
  port: Nullable<number>;
  protocol: Nullable<'wss' | 'ws' | 'mqtt' | 'mqtts' | 'tcp' | 'ssl' | 'wx' | 'wxs'>;
  username: Nullable<string>;
  password: Nullable<string>;
}

export function isMqttConnected() {
  return !client;
}

export function connectMqtt() {
  if (client) {
    throw new TypeError('Already connected');
  }
  initialize();
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
    codec,
    host: mqttConfig.host,
  } as ConnectOptions;
  if (typeof mqttConfig.port === 'number') {
    options.port = mqttConfig.port;
  }
  if (typeof mqttConfig.protocol === 'string') {
    options.protocol = mqttConfig.protocol;
  }
  if (hasUsername) {
    options.username = mqttConfig.username!;
    if (hasPassword) {
      options.password = mqttConfig.password!;
    }
  }
  client = connect();
}
