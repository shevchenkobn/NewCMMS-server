"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../common");
const db_orchestrator_1 = require("../db-orchestrator");
function getAllTriggerActionPropertyNames() {
    return [
        db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.TRIGGER_ACTIONS),
        'triggerDeviceId', 'actionDeviceId',
    ];
}
exports.getAllTriggerActionPropertyNames = getAllTriggerActionPropertyNames;
function mergeTriggerDevicesIntoTriggerActions(triggerActions, triggerDevices) {
    const triggerActionsWithDevices = triggerActions;
    const triggerDevicesMap = new Map(common_1.getLazyMapper(device => [device.triggerDeviceId, device])(triggerDevices));
    for (const triggerAction of triggerActionsWithDevices) {
        triggerAction.triggerDevice =
            triggerDevicesMap.get(triggerAction.triggerDeviceId);
    }
    return triggerActionsWithDevices;
}
exports.mergeTriggerDevicesIntoTriggerActions = mergeTriggerDevicesIntoTriggerActions;
function mergeActionDevicesIntoTriggerActions(triggerActions, triggerDevices) {
    const triggerActionsWithDevices = triggerActions;
    const triggerDevicesMap = new Map(common_1.getLazyMapper(device => [device.actionDeviceId, device])(triggerDevices));
    for (const triggerAction of triggerActionsWithDevices) {
        triggerAction.actionDevice =
            triggerDevicesMap.get(triggerAction.actionDeviceId);
    }
    return triggerActionsWithDevices;
}
exports.mergeActionDevicesIntoTriggerActions = mergeActionDevicesIntoTriggerActions;
//# sourceMappingURL=trigger-actions.js.map