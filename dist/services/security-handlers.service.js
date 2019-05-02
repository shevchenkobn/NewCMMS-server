"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const container_1 = require("../di/container");
const auth_1 = require("../utils/auth");
const openapi_1 = require("../utils/openapi");
const auth_service_1 = require("./auth.service");
let authService; // not Nullable<> due to type inference flaw
let securityHandlers = null;
function getSecurityHandlers() {
    if (!securityHandlers) {
        if (!authService) {
            authService = container_1.getContainer().get(auth_service_1.AuthService);
        }
        securityHandlers = {
            'jwt-bearer': async (req, scopes, definition) => {
                const scheme = definition;
                const request = req;
                const jwtScopes = scopes;
                // This is necessary due to peculiarities of error handling by openapi-security-handler: https://github.com/kogosoftwarellc/open-api/blob/db977d3ca6adbaa08c44e0db1231c74c8427eaba/packages/openapi-security-handler/index.ts
                try {
                    if (!request.tokenPayload) {
                        request.tokenPayload = authService.decodeAccessToken(auth_1.getTokenFromRequest(request), jwtScopes);
                    }
                    else {
                        auth_1.assertRequiredScopes(jwtScopes, request.tokenPayload.scopes);
                    }
                    if (!request.user) {
                        const user = await authService.getUserFromPayload(request.tokenPayload);
                        request.user = user;
                    }
                }
                catch (err) {
                    request.authError = err;
                    return false;
                }
                return true;
            },
        };
    }
    return securityHandlers;
}
exports.getSecurityHandlers = getSecurityHandlers;
exports.openApiSecurityHandlerTransfomMiddleware = (err, req, res, next) => {
    next(exports.transformOpenApiSecurityHandlerError(err, req));
};
exports.transformOpenApiSecurityHandlerError = (err, req) => {
    const request = req;
    delete request.tokenPayload;
    if (request.authError && openapi_1.isOpenApiSecurityHandlerError(err)) {
        return request.authError;
    }
    return err;
};
//# sourceMappingURL=security-handlers.service.js.map