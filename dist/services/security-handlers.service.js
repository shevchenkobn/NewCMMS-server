"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const container_1 = require("../di/container");
const auth_service_1 = require("./auth.service");
let auth = null;
let securityHandlers = null;
function getSecurityHandlers() {
    if (!auth) {
        auth = container_1.getContainer().get(auth_service_1.AuthService);
    }
    if (!securityHandlers) {
        securityHandlers = {
            'jwt-bearer': (req, scopes, definition) => {
                return true;
            },
        };
    }
    return securityHandlers;
}
exports.getSecurityHandlers = getSecurityHandlers;
//# sourceMappingURL=security-handlers.service.js.map