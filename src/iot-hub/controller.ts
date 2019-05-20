import { AsyncMqttClient } from 'async-mqtt';
import { Nullable } from '../@types';
import { IActionDevice } from '../models/action-devices.model';
import { ErrorCode, LogicError } from '../services/error.service';
import { logger } from '../services/logger.service';
import { isPhysicalAddress, normalizePhysicalAddress } from '../utils/common';
import { mqttConfig, shareName } from './configuration';
import { getMqttClient } from './index';
import { MqttQoS } from './util';
import { getContainer } from '../di/container';
import {
  ActionDeviceAction,
  IoTService,
  ProcessTriggerResults,
} from './service';
import { IPublishPacket } from 'mqtt-packet';

let subscriber: Nullable<(
  device: IActionDevice,
  action: ActionDeviceAction,
) => void> = null;

const triggersTopicBase = 'triggers/';

enum TopicType {
  TRIGGER_SUB, TRIGGER_RESULT, ACTION_PUB,
}

export async function onConnect(connack: any) {
  const client = getMqttClient();
  const iotService = getContainer().get<IoTService>(IoTService);
  if (subscriber) {
    iotService.off('', subscriber);
  }
  subscriber = (device, action) => {
    client.publish(
      getTopic(TopicType.ACTION_PUB, device.physicalAddress),
      ActionDeviceAction[action],
      {
        qos: MqttQoS.EXACTLY_ONCE,
        retain: true,
        dup: false,
      },
    );
  };

  const triggerDeviceTopic = getTopic(TopicType.TRIGGER_SUB);
  client.subscribe(
    mqttConfig.clusterMode
      ? `$share/${shareName}/${triggerDeviceTopic}`
      : triggerDeviceTopic,
    // tslint:disable:ter-indent
    {
      qos: MqttQoS.EXACTLY_ONCE,
      nl: true,
      rap: true,
      rh: false,
    } as any,
  );
  // tslint:enable:ter-indent

  client.on('message', (topic, payload, packet: IPublishPacket) => {
    if (topic.startsWith(triggersTopicBase)) {
      const triggerDeviceMac = topic.split('/')[1];
      if (!isPhysicalAddress(triggerDeviceMac)) {
        publish(
          client,
          getTopic(TopicType.TRIGGER_RESULT, triggerDeviceMac),
          `1:${ErrorCode.MAC_INVALID}`,
        );
      } else {
        iotService.processTrigger(
          triggerDeviceMac,
          Buffer.isBuffer(payload)
            ? (payload as Buffer).toString('utf8')
            : payload,
        )
          .then(result => {
            publish(
              client,
              getTopic(TopicType.TRIGGER_RESULT, triggerDeviceMac),
              `0:${ProcessTriggerResults[result]}`,
            );
            logger.info(`Result for trigger "${triggerDeviceMac}" is "${ProcessTriggerResults[result]}"`);
          })
          .catch(err => {
            logger.warn(`Error for trigger "${triggerDeviceMac}" is`);
            logger.warn(err);
            publish(
              client,
              getTopic(TopicType.TRIGGER_RESULT, triggerDeviceMac),
              err instanceof LogicError
                ? `1:${err.code}`
                : `1:${ErrorCode.SERVER}`,
            );
          });
      }
    }
  });
}

function publish(client: AsyncMqttClient, topic: string, message: string) {
  client.publish(
    topic,
    message,
    {
      qos: MqttQoS.EXACTLY_ONCE,
      retain: true,
      dup: false,
    },
  ).catch(err => {
    logger.error('Mqtt publish error');
    logger.error(err);
  });
}

function getTopic(type: TopicType, physicalAddress?: string) {
  if (type === TopicType.TRIGGER_SUB) {
    return `${triggersTopicBase}+`;
  }
  if (typeof physicalAddress !== 'string') {
    throw new TypeError('Physical address required');
  }
  switch (type) {
    case TopicType.TRIGGER_RESULT:
      return `${triggersTopicBase}${normalizePhysicalAddress(physicalAddress)}/result`;
    case TopicType.ACTION_PUB:
      return `actions/${normalizePhysicalAddress(physicalAddress)}`;
    default:
      throw new TypeError('Unknown topic type');
  }
}
