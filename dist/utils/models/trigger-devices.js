"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_orchestrator_1 = require("../db-orchestrator");
var TriggerDeviceStatus;
(function (TriggerDeviceStatus) {
    TriggerDeviceStatus["CONNECTED"] = "CONNECTED";
    TriggerDeviceStatus["DISCONNECTED"] = "DISCONNECTED";
})(TriggerDeviceStatus = exports.TriggerDeviceStatus || (exports.TriggerDeviceStatus = {}));
function getAllTriggerDevicePropertyNames() {
    return [
        db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.TRIGGER_DEVICES),
        'physicalAddress', 'status', 'name', 'type',
    ];
}
exports.getAllTriggerDevicePropertyNames = getAllTriggerDevicePropertyNames;
function isValidTriggerDeviceUniqueIdentifier(nameOrTriggerDeviceId) {
    return Object.keys(nameOrTriggerDeviceId).length === 1 && ('name' in nameOrTriggerDeviceId
        || db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.TRIGGER_DEVICES) in nameOrTriggerDeviceId);
}
exports.isValidTriggerDeviceUniqueIdentifier = isValidTriggerDeviceUniqueIdentifier;
//# sourceMappingURL=trigger-devices.js.map