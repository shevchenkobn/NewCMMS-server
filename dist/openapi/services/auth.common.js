"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const auth_service_1 = require("../../services/auth.service");
let AuthCommon = class AuthCommon {
    constructor(authService) {
        this.authService = authService;
    }
};
AuthCommon = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(auth_service_1.AuthService)),
    tslib_1.__metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthCommon);
exports.AuthCommon = AuthCommon;
//# sourceMappingURL=auth.common.js.map