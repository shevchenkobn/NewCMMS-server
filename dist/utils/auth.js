"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("config");
const users_model_1 = require("../models/users.model");
const error_service_1 = require("../services/error.service");
const openapi_1 = require("./openapi");
const jsonwebtoken_1 = require("jsonwebtoken");
exports.jwtAudience = 'human-actors';
let jwtConfig = null;
function getJwtConfig() {
    if (!jwtConfig) {
        jwtConfig = config.get('auth.jwt');
    }
    return jwtConfig;
}
exports.getJwtConfig = getJwtConfig;
function isJwtPayload(payload) {
    return typeof payload === 'object' && payload !== null
        && typeof payload.id === 'number'
        && Array.isArray(payload.scopes)
        && payload.scopes.every((p) => !!openapi_1.JwtBearerScope[p]);
}
exports.isJwtPayload = isJwtPayload;
function getTokenFromRequest(request) {
    if (typeof request.headers.authorization !== 'string') {
        throw new error_service_1.LogicError(error_service_1.ErrorCode.AUTH_NO);
    }
    return getTokenFromAccessTokenString(request.headers.authorization);
}
exports.getTokenFromRequest = getTokenFromRequest;
const bearerRegex = /^Bearer +/;
function getTokenFromAccessTokenString(str) {
    if (!bearerRegex.test(str)) {
        throw new error_service_1.LogicError(error_service_1.ErrorCode.AUTH_BAD_SCHEME);
    }
    return str.replace(bearerRegex, '');
}
exports.getTokenFromAccessTokenString = getTokenFromAccessTokenString;
function getJwtBearerScopes(user) {
    const scopes = [];
    if (user.role & users_model_1.UserRole.EMPLOYEE) {
        scopes.push(openapi_1.JwtBearerScope.EMPLOYEE);
    }
    if (user.role & users_model_1.UserRole.ADMIN) {
        scopes.push(openapi_1.JwtBearerScope.ADMIN);
    }
    return scopes;
}
exports.getJwtBearerScopes = getJwtBearerScopes;
function handleJwtError(err, codeToThrow = error_service_1.ErrorCode.AUTH_BAD) {
    if (err instanceof jsonwebtoken_1.TokenExpiredError) {
        throw new error_service_1.LogicError(error_service_1.ErrorCode.AUTH_EXPIRED);
    }
    throw new error_service_1.LogicError(codeToThrow);
}
exports.handleJwtError = handleJwtError;
function assertRequiredScopes(requiredScopes, actualScopes) {
    if (actualScopes.some(s => !requiredScopes.includes(s))) {
        // Scope is synonymic to user's role
        throw new error_service_1.LogicError(error_service_1.ErrorCode.AUTH_ROLE);
    }
}
exports.assertRequiredScopes = assertRequiredScopes;
//# sourceMappingURL=auth.js.map