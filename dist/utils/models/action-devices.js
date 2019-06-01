"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_orchestrator_1 = require("../db-orchestrator");
var ActionDeviceStatus;
(function (ActionDeviceStatus) {
    ActionDeviceStatus[ActionDeviceStatus["CONNECTED"] = 1] = "CONNECTED";
    ActionDeviceStatus[ActionDeviceStatus["ONLINE"] = 2] = "ONLINE";
    ActionDeviceStatus[ActionDeviceStatus["DISCONNECTED"] = 3] = "DISCONNECTED";
})(ActionDeviceStatus = exports.ActionDeviceStatus || (exports.ActionDeviceStatus = {}));
function getAllActionDevicePropertyNames() {
    return [
        db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.ACTION_DEVICES),
        'physicalAddress', 'status', 'hourlyRate', 'name', 'type',
    ];
}
exports.getAllActionDevicePropertyNames = getAllActionDevicePropertyNames;
//# sourceMappingURL=action-devices.js.map