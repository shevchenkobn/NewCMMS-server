"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_service_1 = require("../services/error.service");
const logger_service_1 = require("../services/logger.service");
const common_1 = require("../utils/common");
const configuration_1 = require("./configuration");
const index_1 = require("./index");
const util_1 = require("./util");
const container_1 = require("../di/container");
const service_1 = require("./service");
let subscriber = null;
const triggersTopicBase = 'triggers/';
var TopicType;
(function (TopicType) {
    TopicType[TopicType["TRIGGER_SUB"] = 0] = "TRIGGER_SUB";
    TopicType[TopicType["TRIGGER_RESULT"] = 1] = "TRIGGER_RESULT";
    TopicType[TopicType["ACTION_PUB"] = 2] = "ACTION_PUB";
})(TopicType || (TopicType = {}));
async function onConnect(connack) {
    const client = index_1.getMqttClient();
    const iotService = container_1.getContainer().get(service_1.IoTService);
    if (subscriber) {
        iotService.off('action-device/toggle', subscriber);
        subscriber = null;
    }
    subscriber = (device, action) => {
        client.publish(getTopic(TopicType.ACTION_PUB, device.physicalAddress), service_1.ActionDeviceAction[action], {
            qos: util_1.MqttQoS.EXACTLY_ONCE,
            retain: true,
            dup: false,
        }).then(() => {
            logger_service_1.logger.info(`Action device "${device.physicalAddress}" is notified about "${service_1.ActionDeviceAction[action]}"`);
        }).catch(err => {
            if (subscriber) {
                logger_service_1.logger.error(`Failed to publish action to "${device.physicalAddress}". Retrying...`);
                subscriber(device, action);
            }
            else {
                logger_service_1.logger.error(`Failed to publish action to "${device.physicalAddress}". Cannot retry.`);
            }
        });
    };
    iotService.on('action-device/toggle', subscriber);
    const triggerDeviceTopic = getTopic(TopicType.TRIGGER_SUB);
    client.subscribe(configuration_1.mqttConfig.clusterMode
        ? `$share/${configuration_1.shareName}/${triggerDeviceTopic}`
        : triggerDeviceTopic, 
    // tslint:disable:ter-indent
    {
        qos: util_1.MqttQoS.EXACTLY_ONCE,
        nl: true,
        rap: true,
        rh: false,
    });
    // tslint:enable:ter-indent
    client.on('message', (topic, payload, packet) => {
        if (topic.startsWith(triggersTopicBase)) {
            const triggerDeviceMac = topic.split('/')[1];
            if (!common_1.isPhysicalAddress(triggerDeviceMac)) {
                publish(client, getTopic(TopicType.TRIGGER_RESULT, triggerDeviceMac), `1:${error_service_1.ErrorCode.MAC_INVALID}`);
            }
            else {
                iotService.processTrigger(triggerDeviceMac, Buffer.isBuffer(payload)
                    ? payload.toString('utf8')
                    : payload)
                    .then(result => {
                    publish(client, getTopic(TopicType.TRIGGER_RESULT, triggerDeviceMac), `0:${service_1.ProcessTriggerResults[result]}`);
                    logger_service_1.logger.info(`Result for trigger "${triggerDeviceMac}" is "${service_1.ProcessTriggerResults[result]}"`);
                })
                    .catch(err => {
                    logger_service_1.logger.warn(`Error for trigger "${triggerDeviceMac}" is`);
                    logger_service_1.logger.warn(err);
                    publish(client, getTopic(TopicType.TRIGGER_RESULT, triggerDeviceMac), err instanceof error_service_1.LogicError
                        ? `1:${err.code}`
                        : `1:${error_service_1.ErrorCode.SERVER}`);
                });
            }
        }
    });
}
exports.onConnect = onConnect;
function publish(client, topic, message) {
    client.publish(topic, message, {
        qos: util_1.MqttQoS.EXACTLY_ONCE,
        retain: true,
        dup: false,
    }).catch(err => {
        logger_service_1.logger.error('Mqtt publish error');
        logger_service_1.logger.error(err);
    });
}
function getTopic(type, physicalAddress) {
    if (type === TopicType.TRIGGER_SUB) {
        return `${triggersTopicBase}+`;
    }
    if (typeof physicalAddress !== 'string') {
        throw new TypeError('Physical address required');
    }
    switch (type) {
        case TopicType.TRIGGER_RESULT:
            return `${triggersTopicBase}${common_1.normalizePhysicalAddress(physicalAddress)}/result`;
        case TopicType.ACTION_PUB:
            return `actions/${common_1.normalizePhysicalAddress(physicalAddress)}`;
        default:
            throw new TypeError('Unknown topic type');
    }
}
//# sourceMappingURL=controller.js.map