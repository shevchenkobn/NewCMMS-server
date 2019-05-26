"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// NOTE: Make sure to import it in every entry point you have
const inversify_1 = require("inversify");
require("reflect-metadata");
exports.ASYNC_INIT = Symbol.for('@asyncInit');
exports.TYPES = {
    DbConnection: Symbol.for('DbConnection'),
    DbOrchestrator: Symbol.for('DbOrchestrator'),
    AuthService: Symbol.for('AuthService'),
    UsersModel: Symbol.for('UsersModel'),
    TriggerDevicesModel: Symbol.for('TriggerDevicesModel'),
    ActionDevicesModel: Symbol.for('ActionDevicesModel'),
    TriggerActionsModel: Symbol.for('TriggerActionsModel'),
    BillsModel: Symbol.for('BillsModel'),
    BillRatesModel: Symbol.for('BillRates'),
    AuthCommon: Symbol.for('AuthCommon'),
    UsersCommon: Symbol.for('UsersCommon'),
    TriggerDevicesCommon: Symbol.for('TriggerDevicesCommon'),
    ActionDevicesCommon: Symbol.for('ActionDevicesCommon'),
    TriggerActionsCommon: Symbol.for('TriggerActionsCommon'),
    BillsCommon: Symbol.for('BillsCommon'),
    BillRatesCommon: Symbol.for('BillRatesCommon'),
    IoTService: Symbol.for('IoTService'),
};
const injectables = new Set();
function ensureInjectable(type) {
    if (injectables.has(type)) {
        return;
    }
    inversify_1.decorate(inversify_1.injectable(), type);
    injectables.add(type);
}
exports.ensureInjectable = ensureInjectable;
//# sourceMappingURL=types.js.map