#!/usr/bin/node

import './@types';
import { interfaces } from 'inversify';
// tslint:disable-next-line:no-duplicate-imports
import { Nullable } from './@types';
import {
  createContainer, initDependenciesAsync, typeMap,
} from './di/container';
import { TYPES } from './di/types';
import { connectMqtt } from './iot-hub';
import {
  bindOnExitHandler,
  exitGracefully,
} from './services/exit-handler.service';
import { logger } from './services/logger.service';
import {
  errorHandlingPipeline,
  notFoundHandler,
  validateResponses,
} from './utils/middlewares';
import {
  getOpenApiOptions,
  loadOpenApiDoc,
  saveFullOpenApiDocument,
} from './utils/openapi';
import * as express from 'express';
import { createServer } from 'http';
import * as config from 'config';
import { initialize } from 'express-openapi';
import * as yargs from 'yargs';
import * as cors from 'cors';
import ServiceIdentifier = interfaces.ServiceIdentifier;

export interface IServerConfig {
  host: string;
  port: number;
  openapiDocsPrefix: string;
  cors: Nullable<cors.CorsOptions>;
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

// Avoid polluting global namespace
namespace Di {
  const excludedDependencies: ServiceIdentifier<any>[] = [TYPES.DbOrchestrator];
  export const container = createContainer(
    // This function is needed to ensure ALL async initialized services will be eagerly injected
    Array.from(typeMap.keys()).filter(
      t => !excludedDependencies.includes(t),
    ),
  );
}

Promise.join(
  loadOpenApiDoc(),
  initDependenciesAsync(),
).then(([apiDoc]) => {
  const notProduction = process.env.NODE_ENV !== 'production';
  const { host, port, cors: corsConfig } = config.get<IServerConfig>('server');

  logger.debug(config.get<IServerConfig>('server'))
  const app = express();
  if (corsConfig) {
    app.use(cors(corsConfig));
    logger.info(`CORS enabled for ${corsConfig}`);
  }
  const server = createServer(app);

//  apiDoc['x-express-openapi-disable-coercion-middleware'] = false; // FIXME: delete if requests are coerced without it
  apiDoc['x-express-openapi-disable-defaults-middleware'] = true;
  if (notProduction) {
    apiDoc['x-express-openapi-disable-response-validation-middleware'] = false;
    apiDoc['x-express-openapi-response-validation-strict'] = true;
    apiDoc['x-express-openapi-additional-middleware'] = [validateResponses];
    logger.info('Response OpenApi validation is enabled');
  } else {
    apiDoc['x-express-openapi-disable-response-validation-middleware'] = true;
  }

  const openapiFramework = initialize(
    getOpenApiOptions(app, apiDoc),
  );

  if (argv!.buildOpenapiDoc) {
    logger.info('Saving full OpenApi doc...');
    saveFullOpenApiDocument(openapiFramework.apiDoc).then(() => {
      logger.info('OpenApi doc is saved.');
    }).catch(err => {
      logger.error('Failed to save OpenApi doc due to');
      logger.error(err);
    });
  }

  app.use(errorHandlingPipeline);
  app.use(notFoundHandler);

  connectMqtt().then(() => {
    server.listen(port, host, () => {
      logger.info(`Listening at ${host}:${port}`);
      argv = null;
      if (global.gc) {
        global.gc();
      }
    });

    bindOnExitHandler(() => {
      server.close((err) => {
        if (err) {
          logger.error('TCP socket for HTTP server was closed due to');
          logger.error(err);
        } else {
          logger.info('TCP socket for HTTP server is gracefully closed.');
        }
      });
    }, true);
  });
});
