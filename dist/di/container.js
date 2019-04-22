"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const inversify_1 = require("inversify");
const db_connection_class_1 = require("../services/db-connection.class");
const db_orchestrator_service_1 = require("../services/db-orchestrator.service");
const users_model_1 = require("../models/users.model");
const typeMap = new Map([
    [types_1.TYPES.DbConnection, db_connection_class_1.DbConnection],
    [types_1.TYPES.DbOrchestrator, db_orchestrator_service_1.DbOrchestrator],
    [types_1.TYPES.UsersModel, users_model_1.UsersModel],
]);
function bindDependency(typeId, type) {
    container
        .bind(typeId)
        .to(type || typeMap.get(typeId));
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
function createContainer(ensuredDependencies = null, forceNew = false) {
    if (container && !forceNew) {
        throw new TypeError('Container is already instantiated. Call with `forceNew === true` to override');
    }
    if (!ensuredDependencies || ensuredDependencies === 'all') {
        containedDependencies = Array.from(typeMap.keys());
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
        : typeMap.get(typeId))
        .filter(type => !!type[types_1.ASYNC_INIT]);
}
function updateAsyncInitializables(typeId) {
    const type = typeof typeId !== 'function'
        ? typeMap.get(typeId)
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
function asyncInitializablesUpdater(planAndResolve) {
    return (args) => {
        updateAsyncInitializables(args.serviceIdentifier);
        return planAndResolve(args);
    };
}
//# sourceMappingURL=container.js.map