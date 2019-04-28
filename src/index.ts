#!/usr/bin/node

import './@types';
import { interfaces } from 'inversify';
// tslint:disable-next-line:no-duplicate-imports
import { Nullable } from './@types';
import {
  createContainer, initDependenciesAsync, typeMap,
} from './di/container';
import { TYPES } from './di/types';
import {
  bindOnExitHandler,
  exitGracefully,
} from './services/exit-handler.service';
import { logger } from './services/logger.service';
import { errorHandler, notFoundHandler } from './utils/middlewares';
import { loadOpenApiDoc } from './utils/yaml';
import * as express from 'express';
import { createServer } from 'http';
import * as config from 'config';
import { initialize } from 'express-openapi';
import * as yargs from 'yargs';
import ServiceIdentifier = interfaces.ServiceIdentifier;

export interface IServerConfig {
  host: string;
  port: number;
  openapiDocsPrefix: string;
}

let argv: Nullable<yargs.Arguments> = yargs
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
  const excludedDependencies: ServiceIdentifier<any>[] = [TYPES.DbOrchestrator];
  return createContainer(
    // This function is needed to ensure ALL async initialized services will be eagerly injected
    Array.from(typeMap.keys()).filter(
      t => !excludedDependencies.includes(t),
    ),
  );
})();

Promise.join(
  loadOpenApiDoc(),
  initDependenciesAsync(),
).then(([apiDoc]) => {
  const notProduction = process.env.NODE_ENV !== 'production';
  const { host, port, openapiDocsPrefix } = config.get<IServerConfig>('server');

  const app = express();
  const server = createServer(app);

  // TODO: initialize openapi
  const openapiFramework = initialize({
    app,
    apiDoc,

  });

  logger.log(openapiFramework.apiDoc);
  if (argv!.buildOpenapiDoc) {
    // TODO: build the doc
  }

  app.use(errorHandler);
  app.use(notFoundHandler);

  bindOnExitHandler(() => {
    server.close();
  }, true);

  server.listen(port, host, () => {
    logger.info(`Listening at ${host}:${port}`);
    argv = null;
    if (global.gc) {
      global.gc();
    }
  });
});
