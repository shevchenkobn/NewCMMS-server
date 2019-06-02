import * as appRoot from 'app-root-path';
import * as bodyParser from 'body-parser';
import { Express, Request, Response } from 'express';
import { ExpressOpenAPIArgs, Operation } from 'express-openapi';
import { promises as fsPromises } from 'fs';
import * as refParser from 'json-schema-ref-parser';
import { IOpenAPIResponseValidator } from 'openapi-response-validator';
import { OpenAPIV3 } from 'openapi-types';
import * as path from 'path';
import * as yaml from 'yaml';
import { errorTransformer } from '../services/error.service';
import { logger } from '../services/logger.service';
import { getSecurityHandlers } from '../services/security-handlers.service';
import { isPhysicalAddress } from './common';

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

export const jwtBearerScheme = 'jwt-bearer';

export enum JwtBearerScope {
  EMPLOYEE = 'employee',
  ADMIN = 'admin',
  TOKEN_REFRESH = 'token:refresh',
}

export const jwtScopeStrings = Object.values(JwtBearerScope);

export interface IOpenApiRequest extends Request {
  apiDoc: OpenAPIV3.Document & Record<string, any>;
}

export interface IOpenApiResponse extends Response, IOpenAPIResponseValidator {

}

export interface IOpenApiFinalError {
  status: number;
  errors?: any[];
}

export interface IOpenApiSecurityHandlerError {
  status: 401;
  message: string;
  errorCode: 'authentication.openapi.security';
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

export namespace CustomFormats {
  const decimalRegex = /^(\d{1,7}|\d{0,7}\.\d{1,7})$/;
  export const formats = {
    // tslint:disable-next-line:function-name
    ['physical-address'](value: string) {
      return isPhysicalAddress(value);
    },
    // tslint:disable-next-line:function-name
    ['decimal-13-6'](value: string) {
      return decimalRegex.test(value);
    },
  };
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
    customFormats: CustomFormats.formats as any,
    enableObjectCoercion: true,
    errorTransformer: errorTransformer as any,
    exposeApiDocs: true,
    // pathSecurity: null, //FIXME: maybe needed
    paths: getOpenApiResolversBasePath(),
    pathsIgnore: /\.(spec|test)$/,
    promiseMode: true,
    securityHandlers: getSecurityHandlers(),
    validateApiDoc: true,
  };
}

export function getOpenApiResolversBasePath() {
  return path.join(__dirname, '../openapi/resolvers/');
}

export function isOpenApiFinalError(
  err: any,
): err is IOpenApiFinalError {
  return typeof err === 'object' && err !== null
    && typeof err.status === 'number' && Array.isArray(err.errors);
}

export function saveFullOpenApiDocument(doc: any) {
  return fsPromises.writeFile(
    appRoot.resolve('openapi/dist/openapi.yaml'),
    yaml.stringify(doc, { keepCstNodes: true }),
    'utf8',
  );
}

export function isOpenApiSecurityHandlerError(
  err: any,
): err is IOpenApiSecurityHandlerError {
  return typeof err === 'object' && err !== null
    && err.status === 401
    && typeof err.message === 'string'
    && err.errorCode === 'authentication.openapi.security';
}

export function getParamNameFromScriptName(fileName: string) {
  const name = path.basename(path.resolve(fileName), path.extname(fileName));
  return pathSegmentToParamName(name);
}

export function getParamNamesFromScriptPath(fileName: string) {
  const basePath = getOpenApiResolversBasePath();
  const fileNameAbs = path.resolve(fileName);
  if (!fileNameAbs.startsWith(basePath)) {
    throw new TypeError(`Path "${fileName}" is outside OpenAPI resolvers directory!`);
  }
  const pathSegments = fileNameAbs.split(path.sep);
  pathSegments[pathSegments.length - 1] = path.basename(
    pathSegments[pathSegments.length - 1],
    path.extname(pathSegments[pathSegments.length - 1]),
  );
  const params = [];
  for (const segment of pathSegments) {
    if (isParamPathSegment(segment)) {
      params.push(pathSegmentToParamName(segment, true));
    }
  }
  return params;
}

function pathSegmentToParamName(segment: string, checked = false) {
  if (!checked && !isParamPathSegment(segment)) {
    throw new TypeError(`"${segment}" must be in curve parenthesis {} to be a valid parameter name`);
  }
  return segment.slice(1, -1);
}

function isParamPathSegment(segment: string) {
  return segment[0] === '{' || segment[segment.length - 1] === '}';
}
