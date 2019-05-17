"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mqttr_1 = require("mqttr");
const config = require("config");
const logger_service_1 = require("../services/logger.service");
const configuration_1 = require("./configuration");
const controller_1 = require("./controller");
let client = null;
function isMqttConnected() {
    return client && client.connected;
}
exports.isMqttConnected = isMqttConnected;
function connectMqtt() {
    if (isMqttConnected()) {
        throw new TypeError('Already connected');
    }
    if (client) {
        return getConnectPromise();
    }
    initialize();
    return getConnectPromise();
}
exports.connectMqtt = connectMqtt;
function getMqttClient() {
    if (!isMqttConnected()) {
        throw new TypeError('Not connected to mqtt');
    }
    return client;
}
exports.getMqttClient = getMqttClient;
function initialize() {
    const mqttConfig = config.get('mqtt');
    const hasUsername = typeof mqttConfig.username === 'string';
    const hasPassword = typeof mqttConfig.password === 'string';
    if (hasPassword && !hasUsername) {
        throw new TypeError('If password is used, username is also required');
    }
    const options = {
        clientId: configuration_1.clientId,
        will: configuration_1.will,
        // codec: codec,
        host: mqttConfig.host,
        log: logger_service_1.logger,
        protocol: 'mqtt',
        protocolVersion: 5,
        keepalive: 60,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        rejectUnauthorized: true,
    };
    options.properties = {
        sessionExpiryInterval: 60,
    };
    if (typeof mqttConfig.port === 'number') {
        options.port = mqttConfig.port;
    }
    if (hasUsername) {
        options.username = mqttConfig.username;
        if (hasPassword) {
            options.password = mqttConfig.password;
        }
    }
    client = mqttr_1.connect();
    client.on('connect', controller_1.onConnect);
}
function getConnectPromise() {
    return new Promise((resolve, reject) => {
        if (!client) {
            reject(new Error('Unknown mqtt service state'));
            return;
        }
        client.once('connect', (connack) => {
            if (!client) {
                reject(new Error('Unknown mqtt service state'));
                return;
            }
            client.off('error', reject);
            resolve(connack);
        });
        client.once('error', reject);
    });
}
//# sourceMappingURL=index.js.map