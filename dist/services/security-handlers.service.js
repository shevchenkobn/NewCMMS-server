"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const container_1 = require("../di/container");
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
                const user = await authService.getUserFromRequestByAccessToken(request, jwtScopes);
                request.user = user;
                return true;
            },
        };
    }
    return securityHandlers;
}
exports.getSecurityHandlers = getSecurityHandlers;
//# sourceMappingURL=security-handlers.service.js.map