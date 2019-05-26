"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const service_1 = require("../iot-hub/service");
const action_devices_model_1 = require("../models/action-devices.model");
const bill_rates_model_1 = require("../models/bill-rates.model");
const bills_model_1 = require("../models/bills.model");
const trigger_actions_model_1 = require("../models/trigger-actions.model");
const trigger_devices_model_1 = require("../models/trigger-devices.model");
const users_model_1 = require("../models/users.model");
const action_devices_common_1 = require("../openapi/services/action-devices.common");
const auth_common_1 = require("../openapi/services/auth.common");
const bill_rates_common_1 = require("../openapi/services/bill-rates.common");
const bills_common_1 = require("../openapi/services/bills.common");
const trigger_actions_common_1 = require("../openapi/services/trigger-actions.common");
const trigger_devices_common_1 = require("../openapi/services/trigger-devices.common");
const users_common_1 = require("../openapi/services/users.common");
const auth_service_1 = require("../services/auth.service");
const db_connection_class_1 = require("../services/db-connection.class");
const db_orchestrator_class_1 = require("../services/db-orchestrator.class");
const types_1 = require("./types");
exports.typeMap = new Map([
    [types_1.TYPES.DbConnection, db_connection_class_1.DbConnection],
    [types_1.TYPES.DbOrchestrator, db_orchestrator_class_1.DbOrchestrator],
    [types_1.TYPES.AuthService, auth_service_1.AuthService],
    [types_1.TYPES.UsersModel, users_model_1.UsersModel],
    [types_1.TYPES.TriggerDevicesModel, trigger_devices_model_1.TriggerDevicesModel],
    [types_1.TYPES.ActionDevicesModel, action_devices_model_1.ActionDevicesModel],
    [types_1.TYPES.TriggerActionsModel, trigger_actions_model_1.TriggerActionsModel],
    [types_1.TYPES.BillsModel, bills_model_1.BillsModel],
    [types_1.TYPES.BillRatesModel, bill_rates_model_1.BillRatesModel],
    [types_1.TYPES.AuthCommon, auth_common_1.AuthCommon],
    [types_1.TYPES.UsersCommon, users_common_1.UsersCommon],
    [types_1.TYPES.TriggerDevicesCommon, trigger_devices_common_1.TriggerDevicesCommon],
    [types_1.TYPES.ActionDevicesCommon, action_devices_common_1.ActionDevicesCommon],
    [types_1.TYPES.TriggerActionsCommon, trigger_actions_common_1.TriggerActionsCommon],
    [types_1.TYPES.BillsCommon, bills_common_1.BillsCommon],
    [types_1.TYPES.BillRatesCommon, bill_rates_common_1.BillRatesCommon],
    [types_1.TYPES.IoTService, service_1.IoTService],
]);
function bindDependency(typeId, type) {
    container
        .bind(typeId)
        .to(type || exports.typeMap.get(typeId));
}
let container = null;
let containedDependencies = null;
function getContainer() {
    if (!container) {
        throw new TypeError('Container is not instantiated');
    }
    return container;
}
exports.getContainer = getContainer;
function isContainerCreated() {
    return !!container;
}
exports.isContainerCreated = isContainerCreated;
function getContainedDependencies() {
    if (!container) {
        throw new TypeError('Container is not instantiated');
    }
    return containedDependencies.keys();
}
exports.getContainedDependencies = getContainedDependencies;
function addContainedDependencies(typeIds) {
    if (!container) {
        throw new TypeError('Container is not instantiated');
    }
    for (const typeId of typeIds) {
        bindDependency(typeId);
        updateAsyncInitializables(typeId);
    }
}
exports.addContainedDependencies = addContainedDependencies;
function createContainer(ensuredDependencies = null, forceNew = false) {
    if (container && !forceNew) {
        throw new TypeError('Container is already instantiated. Call with `forceNew === true` to override');
    }
    if (!ensuredDependencies || ensuredDependencies === 'all') {
        containedDependencies = Array.from(exports.typeMap.keys());
    }
    else if (ensuredDependencies === 'autoBindAll'
        || (Array.isArray(ensuredDependencies) && ensuredDependencies.length === 0)) {
        containedDependencies = [];
    }
    else {
        const possibleDependencies = Object.values(types_1.TYPES);
        const actualDependencies = new Set(ensuredDependencies
            .filter(dep => possibleDependencies.includes(dep)));
        if (actualDependencies.size === 0) {
            throw new TypeError('No type ids were specified. Please, specify them from the `TYPES` object from the `types.ts` file.');
        }
        if (actualDependencies.size !== ensuredDependencies.length) {
            throw new TypeError('Bad or duplicated type ids were specified. Please, specify them from the `TYPES` object from the `types.ts` file.');
        }
        containedDependencies = Array.from(actualDependencies);
    }
    initPromise = null;
    asyncInitializables = null;
    container = new inversify_1.Container({
        autoBindInjectable: true,
        defaultScope: inversify_1.BindingScopeEnum.Singleton,
    });
    for (const typeId of containedDependencies) {
        bindDependency(typeId);
    }
    return container;
}
exports.createContainer = createContainer;
let initPromise = null;
let asyncInitializables = null;
function initDependenciesAsync() {
    if (!container) {
        throw new TypeError('Container is not instantiated');
    }
    if (initPromise) {
        return initPromise;
    }
    if (!asyncInitializables) {
        asyncInitializables = getAsyncInitializaables();
    }
    initPromise = Promise.all(asyncInitializables
        .map((typeId) => container.get(typeId)[types_1.ASYNC_INIT]));
    return initPromise;
}
exports.initDependenciesAsync = initDependenciesAsync;
function getAsyncInitializaables() {
    return containedDependencies
        .map(typeId => typeof typeId === 'function'
        ? typeId
        : exports.typeMap.get(typeId))
        .filter(type => !!type[types_1.ASYNC_INIT]);
}
function updateAsyncInitializables(typeId) {
    const type = typeof typeId !== 'function'
        ? exports.typeMap.get(typeId)
        : typeId;
    if (!type[types_1.ASYNC_INIT]) {
        return;
    }
    if (!initPromise) {
        if (!asyncInitializables) {
            asyncInitializables = [];
        }
        asyncInitializables.push(type);
    }
    else {
        initPromise = Promise.all([initPromise, type]);
    }
}
//# sourceMappingURL=container.js.map