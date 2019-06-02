"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appRoot = require("app-root-path");
const bodyParser = require("body-parser");
const fs_1 = require("fs");
const refParser = require("json-schema-ref-parser");
const path = require("path");
const yaml = require("yaml");
const error_service_1 = require("../services/error.service");
const logger_service_1 = require("../services/logger.service");
const security_handlers_service_1 = require("../services/security-handlers.service");
const common_1 = require("./common");
exports.jwtBearerScheme = 'jwt-bearer';
var JwtBearerScope;
(function (JwtBearerScope) {
    JwtBearerScope["EMPLOYEE"] = "employee";
    JwtBearerScope["ADMIN"] = "admin";
    JwtBearerScope["TOKEN_REFRESH"] = "token:refresh";
})(JwtBearerScope = exports.JwtBearerScope || (exports.JwtBearerScope = {}));
exports.jwtScopeStrings = Object.values(JwtBearerScope);
function loadOpenApiDoc(rootPath = appRoot.resolve('openapi/src/openapi.yaml'), copyReferenced = false) {
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
    });
}
exports.loadOpenApiDoc = loadOpenApiDoc;
var CustomFormats;
(function (CustomFormats) {
    const decimalRegex = /^(\d{1,7}|\d{0,7}\.\d{1,7})$/;
    CustomFormats.formats = {
        // tslint:disable-next-line:function-name
        ['physical-address'](value) {
            return common_1.isPhysicalAddress(value);
        },
        // tslint:disable-next-line:function-name
        ['decimal-13-6'](value) {
            return decimalRegex.test(value);
        },
    };
})(CustomFormats = exports.CustomFormats || (exports.CustomFormats = {}));
function getOpenApiOptions(app, apiDoc) {
    return {
        app,
        apiDoc,
        logger: logger_service_1.logger,
        consumesMiddleware: {
            'application/json': bodyParser.json({
                strict: false,
            }),
        },
        customFormats: CustomFormats.formats,
        enableObjectCoercion: true,
        errorTransformer: error_service_1.errorTransformer,
        exposeApiDocs: true,
        // pathSecurity: null, //FIXME: maybe needed
        paths: getOpenApiResolversBasePath(),
        pathsIgnore: /\.(spec|test)$/,
        promiseMode: true,
        securityHandlers: security_handlers_service_1.getSecurityHandlers(),
        validateApiDoc: true,
    };
}
exports.getOpenApiOptions = getOpenApiOptions;
function getOpenApiResolversBasePath() {
    return path.join(__dirname, '../openapi/resolvers/');
}
exports.getOpenApiResolversBasePath = getOpenApiResolversBasePath;
function isOpenApiFinalError(err) {
    return typeof err === 'object' && err !== null
        && typeof err.status === 'number' && Array.isArray(err.errors);
}
exports.isOpenApiFinalError = isOpenApiFinalError;
function saveFullOpenApiDocument(doc) {
    return fs_1.promises.writeFile(appRoot.resolve('openapi/dist/openapi.yaml'), yaml.stringify(doc, { keepCstNodes: true }), 'utf8');
}
exports.saveFullOpenApiDocument = saveFullOpenApiDocument;
function isOpenApiSecurityHandlerError(err) {
    return typeof err === 'object' && err !== null
        && err.status === 401
        && typeof err.message === 'string'
        && err.errorCode === 'authentication.openapi.security';
}
exports.isOpenApiSecurityHandlerError = isOpenApiSecurityHandlerError;
function getParamNameFromScriptName(fileName) {
    const name = path.basename(path.resolve(fileName), path.extname(fileName));
    return pathSegmentToParamName(name);
}
exports.getParamNameFromScriptName = getParamNameFromScriptName;
function getParamNamesFromScriptPath(fileName) {
    const basePath = getOpenApiResolversBasePath();
    const fileNameAbs = path.resolve(fileName);
    if (!fileNameAbs.startsWith(basePath)) {
        throw new TypeError(`Path "${fileName}" is outside OpenAPI resolvers directory!`);
    }
    const pathSegments = fileNameAbs.split(path.sep);
    pathSegments[pathSegments.length - 1] = path.basename(pathSegments[pathSegments.length - 1], path.extname(pathSegments[pathSegments.length - 1]));
    const params = [];
    for (const segment of pathSegments) {
        if (isParamPathSegment(segment)) {
            params.push(pathSegmentToParamName(segment, true));
        }
    }
    return params;
}
exports.getParamNamesFromScriptPath = getParamNamesFromScriptPath;
function pathSegmentToParamName(segment, checked = false) {
    if (!checked && !isParamPathSegment(segment)) {
        throw new TypeError(`"${segment}" must be in curve parenthesis {} to be a valid parameter name`);
    }
    return segment.slice(1, -1);
}
function isParamPathSegment(segment) {
    return segment[0] === '{' || segment[segment.length - 1] === '}';
}
//# sourceMappingURL=openapi.js.map