"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("config");
const error_service_1 = require("../services/error.service");
let jwtConfig = null;
function getJwtConfig() {
    if (!jwtConfig) {
        jwtConfig = config.get('jwt');
    }
    return jwtConfig;
}
exports.getJwtConfig = getJwtConfig;
function getTokenFromRequest(request) {
    if (typeof request.headers.authorization !== 'string') {
        throw new error_service_1.LogicError(error_service_1.ErrorCode.AUTH_NO);
    }
    return getTokenFromString(request.headers.authorization);
}
exports.getTokenFromRequest = getTokenFromRequest;
const bearerRegex = /^Bearer +/;
function getTokenFromString(str) {
    if (!bearerRegex.test(str)) {
        throw new error_service_1.LogicError(error_service_1.ErrorCode.AUTH_BAD_SCHEME);
    }
    return str.replace(bearerRegex, '');
}
exports.getTokenFromString = getTokenFromString;
//# sourceMappingURL=auth.js.map