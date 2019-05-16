import { ConnectOptions } from 'mqttr';
import { raw } from 'mqttr/lib/codec';
import { MqqtQoS } from './util';

// export const codec = raw();

export const clientId = `server_${Math.random().toString(16).substr(2, 8)}`;

export const will: ConnectOptions['will'] = {
  topic: '/server',
  payload: JSON.stringify({
    id: clientId,
    e: 'shutdown',
  }),
  retain: true,
  qos: MqqtQoS.EXACTLY_ONCE,
};
(will as any).properties = {
  willDelayInterval: 0,
  messageExpiryInterval: 0,
  contentType: 'application/json',
};
