"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
// export const codec = raw();
exports.clientId = `server_${Math.random().toString(16).substr(2, 8)}`;
exports.will = {
    topic: '/server',
    payload: JSON.stringify({
        id: exports.clientId,
        e: 'shutdown',
    }),
    retain: true,
    qos: util_1.MqqtQoS.EXACTLY_ONCE,
};
exports.will.properties = {
    willDelayInterval: 0,
    messageExpiryInterval: 0,
    contentType: 'application/json',
};
//# sourceMappingURL=configuration.js.map