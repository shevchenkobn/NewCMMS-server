"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async_mqtt_1 = require("async-mqtt");
const exit_handler_service_1 = require("../services/exit-handler.service");
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
    const hasUsername = typeof configuration_1.mqttConfig.broker.username === 'string';
    const hasPassword = typeof configuration_1.mqttConfig.broker.password === 'string';
    if (hasPassword && !hasUsername) {
        throw new TypeError('If password is used, username is also required');
    }
    const url = `${configuration_1.mqttConfig.broker.protocol}://${configuration_1.mqttConfig.broker.host}:${configuration_1.mqttConfig.broker.port || 1883}`;
    const options = {
        clientId: configuration_1.clientId,
        will: configuration_1.will,
        protocolVersion: 4,
        keepalive: 60,
        reconnectPeriod: 0,
        connectTimeout: 30 * 1000,
        rejectUnauthorized: true,
        resubscribe: true,
    };
    options.properties = {
        sessionExpiryInterval: 60,
    };
    if (typeof configuration_1.mqttConfig.broker.port === 'number') {
        options.port = configuration_1.mqttConfig.broker.port;
    }
    if (hasUsername) {
        options.username = configuration_1.mqttConfig.broker.username;
        if (hasPassword) {
            options.password = configuration_1.mqttConfig.broker.password;
        }
    }
    logger_service_1.logger.info(`Connecting to mqtt at "${url}"...`);
    client = async_mqtt_1.connect(url, options);
    client.on('connect', (connack) => {
        logger_service_1.logger.info('Connected to mqtt.');
        controller_1.onConnect(connack);
    });
    client.on('close', () => logger_service_1.logger.info('Disconnected from mqtt.'));
    client.on('reconnect', () => logger_service_1.logger.info('Reconnecting to mqtt...'));
    exit_handler_service_1.bindOnExitHandler(() => {
        if (!client) {
            throw new Error('Unknown mqtt service state');
        }
        logger_service_1.logger.info('Disconnecting from mqtt...');
        client.end(false);
    }, true);
}
function getConnectPromise() {
    return new Promise((resolve, reject) => {
        if (!client) {
            reject(new Error('Unknown mqtt service state'));
            return;
        }
        const errCb = (err) => {
            reject(err);
        };
        client.once('connect', (connack) => {
            if (!client) {
                reject(new Error('Unknown mqtt service state'));
                return;
            }
            client.off('error', errCb);
            resolve(connack);
        });
        client.once('error', errCb);
    });
}
//# sourceMappingURL=index.js.map