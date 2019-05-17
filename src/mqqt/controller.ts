import { getMqttClient } from './index';
import { Message } from 'mqttr';
import { MqqtQoS } from './util';
import { eventEmitter } from '../services/event-emitter.service';
import { logger } from '../services/logger.service';
import { getContainer } from '../di/container';
import { IoTService } from './service';

const iotService = getContainer().get<IoTService>(IoTService);

export async function onConnect(connack: any) {
  const client = getMqttClient();

  client.subscribe('/triggers/:triggerMac', (message: Message) => {

  }, {
    qos: MqqtQoS.EXACTLY_ONCE,
    nl: true,
    rap: true,
    rh: true,
  } as any, (err, granted) => {
    if (err) {
      logger.error(err);
    }
    logger.info(granted);
  });
}
