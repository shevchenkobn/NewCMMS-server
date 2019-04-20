"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const inversify_1 = require("inversify");
const db_connection_class_1 = require("../services/db-connection.class");
const logger_service_1 = require("../services/logger.service");
const db_orchestrator_service_1 = require("../services/db-orchestrator.service");
const typeMap = new Map([
    [types_1.TYPES.DbConnection, db_connection_class_1.DbConnection],
    [types_1.TYPES.DbOrchestrator, db_orchestrator_service_1.DbOrchestrator],
]);
// FIXME: otherwise try this: https://github.com/inversify/InversifyJS/blob/master/wiki/middleware.md#context-interceptor
const noDependencyHandler = (request) => {
    logger_service_1.logger.debug('yeeet, resolved no dep');
    bindDependency(request.target.serviceIdentifier);
    return true;
};
function bindDependency(typeId, type) {
    container
        .bind(typeId)
        .to(type || typeMap.get(typeId))
        .whenNoAncestorMatches(noDependencyHandler);
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
function createContainer(dependencies = null, forceNew = false) {
    if (container && !forceNew) {
        throw new TypeError('Container is already instantiated. Call with `forceNew === true` to override');
    }
    if (!dependencies || dependencies === 'all') {
        containedDependencies = Array.from(typeMap.keys());
    }
    else {
        const possibleDependencies = Object.values(types_1.TYPES);
        const actualDependencies = new Set(dependencies
            .filter(dep => possibleDependencies.includes(dep)));
        if (actualDependencies.size === 0) {
            throw new TypeError('No type ids were specified. Please, specify them from the `TYPES` object from the `types.ts` file.');
        }
        if (actualDependencies.size !== dependencies.length) {
            throw new TypeError('Bad or duplicated type ids were specified. Please, specify them from the `TYPES` object from the `types.ts` file.');
        }
        containedDependencies = Array.from(actualDependencies);
    }
    initPromise = null;
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
function initAsync() {
    if (!container) {
        throw new TypeError('Container is not instantiated');
    }
    if (initPromise) {
        return initPromise;
    }
    initPromise = Promise.all(containedDependencies
        .map((typeId) => container.get(typeId)[types_1.ASYNC_INIT]));
    return initPromise;
}
exports.initAsync = initAsync;
//# sourceMappingURL=container.js.map