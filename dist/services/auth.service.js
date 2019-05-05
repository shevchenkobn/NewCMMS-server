"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
var _a;
"use strict";
const inversify_1 = require("inversify");
const jwt = require("jsonwebtoken");
const types_1 = require("../di/types");
const auth_1 = require("../utils/auth");
const key_pairs_1 = require("../utils/key-pairs");
const users_model_1 = require("../models/users.model");
const openapi_1 = require("../utils/openapi");
const error_service_1 = require("./error.service");
let AuthService = class AuthService {
    constructor(usersModel, keyPaths = key_pairs_1.getDefaultKeyPaths()) {
        this._jwtConfig = auth_1.getJwtConfig();
        if (!auth_1.isValidAlgorithm(this._jwtConfig.algorithms.accessToken)) {
            throw new TypeError(`The access token algorithm must comply to ${auth_1.getAlgorithmVariants()}`);
        }
        if (!auth_1.isValidAlgorithm(this._jwtConfig.algorithms.refreshToken)) {
            throw new TypeError(`The refresh token algorithm must comply to ${auth_1.getAlgorithmVariants()}`);
        }
        this[types_1.ASYNC_INIT] = key_pairs_1.loadKeys(keyPaths, false).then(keys => {
            this._keys = keys;
        });
        this._usersModel = usersModel;
    }
    generateAccessToken(user) {
        return jwt.sign({
            id: user.userId,
            scopes: auth_1.getJwtBearerScopes(user),
        }, this._keys.accessToken.privateKey, {
            algorithm: this._jwtConfig.algorithms.accessToken,
            subject: user.userId.toString(),
            audience: auth_1.jwtAudience,
            expiresIn: this._jwtConfig.expiration.accessToken,
            issuer: this._jwtConfig.issuer,
        });
    }
    generateRefreshToken(user) {
        return jwt.sign({
            id: user.userId,
            scopes: [openapi_1.JwtBearerScope.TOKEN_REFRESH],
        }, this._keys.refreshToken.privateKey, {
            algorithm: this._jwtConfig.algorithms.refreshToken,
            subject: user.userId.toString(),
            audience: auth_1.jwtAudience,
            expiresIn: this._jwtConfig.expiration.refreshToken,
            issuer: this._jwtConfig.issuer,
        });
    }
    getAccessTokenPayload(token, scopes = null, ignoreExpiration = false) {
        let payload;
        try {
            payload = jwt.verify(token, this._keys.accessToken.publicKey, {
                ignoreExpiration,
                audience: auth_1.jwtAudience,
                algorithms: [this._jwtConfig.algorithms.accessToken],
                issuer: this._jwtConfig.issuer,
            });
        }
        catch (err) {
            auth_1.handleJwtError(err);
        }
        if (!auth_1.isJwtPayload(payload)) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.AUTH_BAD);
        }
        if (scopes) {
            auth_1.assertRequiredScopes(scopes, payload.scopes);
        }
        return payload;
    }
    getRefreshTokenPayload(token, checkScope = true, ignoreExpiration = false) {
        let payload;
        try {
            payload = jwt.verify(token, this._keys.refreshToken.publicKey, {
                ignoreExpiration,
                audience: auth_1.jwtAudience,
                algorithms: [this._jwtConfig.algorithms.refreshToken],
                issuer: this._jwtConfig.issuer,
            });
        }
        catch (err) {
            auth_1.handleJwtError(err, error_service_1.ErrorCode.AUTH_BAD_REFRESH);
        }
        if (!auth_1.isJwtPayload(payload)) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.AUTH_BAD_REFRESH);
        }
        if (checkScope
            && (payload.scopes.length !== 1
                || payload.scopes[0] !== openapi_1.JwtBearerScope.TOKEN_REFRESH)) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.AUTH_BAD_REFRESH);
        }
        return payload;
    }
    getUserFromRequestByAccessToken(request, scopes = null, ignoreExpiration = false) {
        return this.getUserFromAccessToken(auth_1.getTokenFromRequest(request), scopes, ignoreExpiration);
    }
    async getUserFromAccessToken(token, scopes = null, ignoreExpiration = false) {
        const payload = this.getAccessTokenPayload(token, scopes, ignoreExpiration);
        return this.getUserFromPayload(payload);
    }
    async getUserFromPayload(payload) {
        const user = await this._usersModel.getOne({ userId: payload.id });
        if (!user) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.AUTH_BAD);
        }
        return user;
    }
};
_a = types_1.ASYNC_INIT;
AuthService[_a] = true;
AuthService = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(users_model_1.UsersModel)),
    tslib_1.__metadata("design:paramtypes", [users_model_1.UsersModel, Object])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map