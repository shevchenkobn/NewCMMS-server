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
  const physicalAddressRegex = /^[\dA-F]{12}$/i;
  export const formats = {
    // tslint:disable-next-line:function-name
    ['physical-address'](value: string) {
      return physicalAddressRegex.test(value);
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
    paths: path.join(__dirname, '../openapi/resolvers/'),
    pathsIgnore: /\.(spec|test)$/,
    promiseMode: true,
    securityHandlers: getSecurityHandlers(),
    validateApiDoc: true,
  };
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
  const name = path.basename(fileName, path.extname(fileName));
  if (name[0] !== '{' || name[name.length - 1] !== '}') {
    throw new TypeError(`"${name}" must be in curve parenthesis {}`);
  }
  return name.slice(1, -1);
}
