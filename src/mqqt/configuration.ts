import { ConnectOptions } from 'mqttr';
import { json } from 'mqttr/lib/codec';
import { MqqtQoS } from './util';

export const codec = json();

export const clientId = `server_${Math.random().toString(16).substr(2, 8)}`;

export const will: ConnectOptions['will'] = {
  topic: '/server',
  payload: codec.encode({
    id: clientId,
    e: 'shutdown',
  } as any),
  retain: true,
  qos: MqqtQoS.EXACTLY_ONCE,
};
