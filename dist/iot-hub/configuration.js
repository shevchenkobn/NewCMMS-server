"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("config");
const util_1 = require("./util");
exports.mqttConfig = config.get('mqtt');
exports.shareName = 'server';
exports.clientId = `${exports.shareName}_${Math.random().toString(16).substr(2, 8)}`;
exports.will = {
    topic: '/servers',
    payload: `${exports.clientId}:disconnected`,
    retain: true,
    qos: util_1.MqttQoS.EXACTLY_ONCE,
};
exports.will.properties = {
    willDelayInterval: 0,
    messageExpiryInterval: 0,
    contentType: 'application/json',
};
//# sourceMappingURL=configuration.js.map