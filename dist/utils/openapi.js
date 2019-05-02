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
exports.jwtBearerScheme = 'jwt-bearer';
var JwtBearerScope;
(function (JwtBearerScope) {
    JwtBearerScope["EMPLOYEE"] = "employee";
    JwtBearerScope["ADMIN"] = "admin";
    JwtBearerScope["TOKEN_REFRESH"] = "token:refresh";
})(JwtBearerScope = exports.JwtBearerScope || (exports.JwtBearerScope = {}));
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
        customFormats: {},
        enableObjectCoercion: true,
        errorTransformer: error_service_1.errorTransformer,
        exposeApiDocs: true,
        // pathSecurity: null, //FIXME: maybe needed
        paths: path.join(__dirname, '../openapi/resolvers/'),
        pathsIgnore: /\.(spec|test)$/,
        promiseMode: true,
        securityHandlers: security_handlers_service_1.getSecurityHandlers(),
        validateApiDoc: true,
    };
}
exports.getOpenApiOptions = getOpenApiOptions;
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
//# sourceMappingURL=openapi.js.map