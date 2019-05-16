#!/usr/bin/node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./@types");
const container_1 = require("./di/container");
const types_1 = require("./di/types");
const mqqt_1 = require("./mqqt");
const exit_handler_service_1 = require("./services/exit-handler.service");
const logger_service_1 = require("./services/logger.service");
const middlewares_1 = require("./utils/middlewares");
const openapi_1 = require("./utils/openapi");
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
// Avoid polluting global namespace
var Di;
(function (Di) {
    const excludedDependencies = [types_1.TYPES.DbOrchestrator];
    Di.container = container_1.createContainer(
    // This function is needed to ensure ALL async initialized services will be eagerly injected
    Array.from(container_1.typeMap.keys()).filter(t => !excludedDependencies.includes(t)));
})(Di || (Di = {}));
Promise.join(openapi_1.loadOpenApiDoc(), container_1.initDependenciesAsync()).then(([apiDoc]) => {
    const notProduction = process.env.NODE_ENV !== 'production';
    const { host, port } = config.get('server');
    const app = express();
    const server = http_1.createServer(app);
    //  apiDoc['x-express-openapi-disable-coercion-middleware'] = false; // FIXME: delete if requests are coerced without it
    apiDoc['x-express-openapi-disable-defaults-middleware'] = true;
    if (notProduction) {
        apiDoc['x-express-openapi-disable-response-validation-middleware'] = false;
        apiDoc['x-express-openapi-response-validation-strict'] = true;
        apiDoc['x-express-openapi-additional-middleware'] = [middlewares_1.validateResponses];
        logger_service_1.logger.info('Response OpenApi validation is enabled');
    }
    else {
        apiDoc['x-express-openapi-disable-response-validation-middleware'] = true;
    }
    const openapiFramework = express_openapi_1.initialize(openapi_1.getOpenApiOptions(app, apiDoc));
    if (argv.buildOpenapiDoc) {
        logger_service_1.logger.info('Saving full OpenApi doc...');
        openapi_1.saveFullOpenApiDocument(openapiFramework.apiDoc).then(() => {
            logger_service_1.logger.info('OpenApi doc is saved.');
        }).catch(err => {
            logger_service_1.logger.error('Failed to save OpenApi doc due to');
            logger_service_1.logger.error(err);
        });
    }
    app.use(middlewares_1.errorHandlingPipeline);
    app.use(middlewares_1.notFoundHandler);
    exit_handler_service_1.bindOnExitHandler(() => {
        server.close((err) => {
            if (err) {
                logger_service_1.logger.error('TCP socket for HTTP server was closed due to');
                logger_service_1.logger.error(err);
            }
            else {
                logger_service_1.logger.info('TCP socket for HTTP server is gracefully closed.');
            }
        });
    }, true);
    mqqt_1.connectMqtt().then(() => {
        server.listen(port, host, () => {
            logger_service_1.logger.info(`Listening at ${host}:${port}`);
            argv = null;
            if (global.gc) {
                global.gc();
            }
        });
    });
});
//# sourceMappingURL=index.js.map