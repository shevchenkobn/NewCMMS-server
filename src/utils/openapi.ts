import * as appRoot from 'app-root-path';
import * as path from 'path';
import * as yaml from 'yaml';
import { promises as fsPromises } from 'fs';
import { Express } from 'express';
import { ExpressOpenAPIArgs, Operation } from 'express-openapi';
import * as refParser from 'json-schema-ref-parser';
import * as bodyParser from 'body-parser';
import { errorTransformer } from '../services/error.service';
import { logger } from '../services/logger.service';
import {
  getSecurityHandlers,
} from '../services/security-handlers.service';
import { OpenAPIV3 } from 'openapi-types';

export interface IOpenApiPathItemHandler {
  parameters?: OpenAPIV3.ParameterObject[];
  summary?: string;
  description?: string;
  get?: Operation;
  put?: Operation;
  post?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  patch?: Operation;
}

export function loadOpenApiDoc(
  rootPath = appRoot.resolve('openapi/src/openapi.yaml'),
  copyReferenced = false,
) {
  return refParser[copyReferenced ? 'bundle' : 'dereference'](rootPath, {
    parse: {
      yaml: {
        order: Number.MIN_SAFE_INTEGER,
        allowEmpty: false,
        canParse: /\.ya?ml$/,
      },
    },
    resolve: {
      external: true,
      file: {
        order: Number.MIN_SAFE_INTEGER,
        canRead: /\.ya?ml$/,
      },
    },
    dereference: {
      circular: false,
    },
  }) as Promise<any>;
}

export function getOpenApiOptions(
  app: Express,
  apiDoc: any,
): ExpressOpenAPIArgs {
  return {
    app,
    apiDoc,
    logger,
    consumesMiddleware: {
      'application/json': bodyParser.json({
        strict: false,
      } as any),
    },
    customFormats: {} as any,
    enableObjectCoercion: true,
    errorTransformer: errorTransformer as any,
    exposeApiDocs: true,
    // pathSecurity: null, //FIXME: maybe needed
    paths: path.join(__dirname, '../openapi/resolvers/'),
    pathsIgnore: /\.(spec|test)$/,
    promiseMode: true,
    securityHandlers: getSecurityHandlers(),
    validateApiDoc: true,
  };
}

export function saveFullOpenApiDocument(doc: any) {
  return fsPromises.writeFile(
    appRoot.resolve('openapi/dist/openapi.yaml'),
    yaml.stringify(doc, { keepCstNodes: true }),
    'utf8',
  );
}
