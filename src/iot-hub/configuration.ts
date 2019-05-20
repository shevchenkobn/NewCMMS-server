
import { DeepReadonly } from '../@types';
import * as config from 'config';
import { IMqttConfig } from './index';
import { MqttQoS } from './util';
import { IClientOptions } from 'async-mqtt';

export const mqttConfig: DeepReadonly<IMqttConfig> = config.get<IMqttConfig>(
  'mqtt',
);

export const shareName = 'server';

export const clientId = `${shareName}_${Math.random().toString(16).substr(2, 8)}`;

export const will: IClientOptions['will'] = {
  topic: 'servers',
  payload: `${clientId}:disconnected`,
  retain: true,
  qos: MqttQoS.EXACTLY_ONCE,
};
(will as any).properties = {
  willDelayInterval: 0,
  messageExpiryInterval: 0,
  contentType: 'application/json',
};
