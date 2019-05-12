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
    const physicalAddressRegex = /^[\dA-F]{12}$/i;
    const decimalRegex = /^(\d+|\d*\.\d+)$/;
    CustomFormats.formats = {
        // tslint:disable-next-line:function-name
        ['physical-address'](value) {
            return physicalAddressRegex.test(value);
        },
        // tslint:disable-next-line:function-name
        ['decimal-10-6'](value) {
            const isDecimal = decimalRegex.test(value);
            if (!isDecimal) {
                return false;
            }
            const partLengths = value.split('.').map(p => p.length);
            return partLengths[1] <= 6 && partLengths[0] + partLengths[1] <= 10;
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
function getParamNameFromScriptName(fileName) {
    const name = path.basename(fileName, path.extname(fileName));
    if (name[0] !== '{' || name[name.length - 1] !== '}') {
        throw new TypeError(`"${name}" must be in curve parenthesis {}`);
    }
    return name.slice(1, -1);
}
exports.getParamNameFromScriptName = getParamNameFromScriptName;
//# sourceMappingURL=openapi.js.map