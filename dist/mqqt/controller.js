"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const util_1 = require("./util");
const logger_service_1 = require("../services/logger.service");
const container_1 = require("../di/container");
const service_1 = require("./service");
const iotService = container_1.getContainer().get(service_1.IoTService);
async function onConnect(connack) {
    const client = index_1.getMqttClient();
    client.subscribe('/triggers/:triggerMac', (message) => {
    }, {
        qos: util_1.MqqtQoS.EXACTLY_ONCE,
        nl: true,
        rap: true,
        rh: true,
    }, (err, granted) => {
        if (err) {
            logger_service_1.logger.error(err);
        }
        logger_service_1.logger.info(granted);
    });
}
exports.onConnect = onConnect;
//# sourceMappingURL=controller.js.map