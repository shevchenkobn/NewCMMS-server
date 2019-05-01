"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const container_1 = require("../di/container");
const auth_service_1 = require("./auth.service");
const logger_service_1 = require("./logger.service");
exports.jwtBearerScheme = 'jwt-bearer';
var JwtBearerScope;
(function (JwtBearerScope) {
    JwtBearerScope["EMPLOYEE"] = "user";
    JwtBearerScope["ADMIN"] = "admin";
    JwtBearerScope["TOKEN_REFRESH"] = "token:refresh";
})(JwtBearerScope = exports.JwtBearerScope || (exports.JwtBearerScope = {}));
let auth = null;
let securityHandlers = null;
function getSecurityHandlers() {
    if (!auth) {
        auth = container_1.getContainer().get(auth_service_1.AuthService);
    }
    if (!securityHandlers) {
        securityHandlers = {
            'jwt-bearer': async (req, scopes, definition) => {
                const scheme = definition;
                const request = req;
                logger_service_1.logger.debug(definition);
                return false;
            },
        };
    }
    return securityHandlers;
}
exports.getSecurityHandlers = getSecurityHandlers;
//# sourceMappingURL=security-handlers.service.js.map