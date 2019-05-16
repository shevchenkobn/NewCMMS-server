import { getMqttClient } from './index';

export function onConnect(connack: any) {
  const client = getMqttClient();
}
