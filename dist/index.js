#!/usr/bin/node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./@types");
const container_1 = require("./di/container");
const types_1 = require("./di/types");
const exit_handler_service_1 = require("./services/exit-handler.service");
const logger_service_1 = require("./services/logger.service");
const middlewares_1 = require("./utils/middlewares");
const yaml_1 = require("./utils/yaml");
const express = require("express");
const http_1 = require("http");
const config = require("config");
const express_openapi_1 = require("express-openapi");
const yargs = require("yargs");
let argv = yargs
    .usage('Run the script to start the server. All options are in configs and defined by the NODE_ENV variable. You can also build a OpenApi YAML document.')
    .version().alias('v', 'version')
    .option('build-openapi-doc', {
    alias: 'o',
    boolean: true,
    default: false,
    description: 'Generate OpenApi YAML document.',
}).argv;
// Function expression is needed to avoid polluting the scope.
const container = (() => {
    const excludedDependencies = [types_1.TYPES.DbOrchestrator];
    return container_1.createContainer(
    // This function is needed to ensure ALL async initialized services will be eagerly injected
    Array.from(container_1.typeMap.keys()).filter(t => !excludedDependencies.includes(t)));
})();
Promise.join(yaml_1.loadOpenApiDoc(), container_1.initDependenciesAsync()).then(([apiDoc]) => {
    const notProduction = process.env.NODE_ENV !== 'production';
    const { host, port, openapiDocsPrefix } = config.get('server');
    const app = express();
    const server = http_1.createServer(app);
    // TODO: initialize openapi
    const openapiFramework = express_openapi_1.initialize({
        app,
        apiDoc,
    });
    logger_service_1.logger.log(openapiFramework.apiDoc);
    if (argv.buildOpenapiDoc) {
        // TODO: build the doc
    }
    app.use(middlewares_1.errorHandler);
    app.use(middlewares_1.notFoundHandler);
    exit_handler_service_1.bindOnExitHandler(() => {
        server.close();
    }, true);
    server.listen(port, host, () => {
        logger_service_1.logger.info(`Listening at ${host}:${port}`);
        argv = null;
        if (global.gc) {
            global.gc();
        }
    });
});
//# sourceMappingURL=index.js.map