"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const users_model_1 = require("../../models/users.model");
const auth_service_1 = require("../../services/auth.service");
const error_service_1 = require("../../services/error.service");
const db_orchestrator_1 = require("../../utils/db-orchestrator");
let AuthCommon = class AuthCommon {
    constructor(authService, usersModel) {
        this.authService = authService;
        this.usersModel = usersModel;
    }
    async getTokensForUser(userCredentials) {
        const user = await this.usersModel.getAssertedUser(userCredentials, [db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.USERS), 'role']);
        return {
            accessToken: this.authService.generateAccessToken(user),
            refreshToken: this.authService
                .generateRefreshToken(user),
        };
    }
    async getNewAccessToken(tokenPair) {
        const accessTokenPayload = this.authService
            .getAccessTokenPayload(tokenPair.accessToken, null, true);
        const refreshTokenPayload = this.authService
            .getRefreshTokenPayload(tokenPair.refreshToken);
        if (accessTokenPayload.id !== refreshTokenPayload.id) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.AUTH_BAD);
        }
        const user = await this.authService.getUserFromPayload(accessTokenPayload);
        return this.authService.generateAccessToken(user);
    }
};
AuthCommon = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(auth_service_1.AuthService)),
    tslib_1.__param(1, inversify_1.inject(users_model_1.UsersModel)),
    tslib_1.__metadata("design:paramtypes", [auth_service_1.AuthService,
        users_model_1.UsersModel])
], AuthCommon);
exports.AuthCommon = AuthCommon;
//# sourceMappingURL=auth.common.js.map