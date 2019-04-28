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
const error_service_1 = require("./error.service");
let AuthService = class AuthService {
    constructor(usersModel, keyPaths = key_pairs_1.getDefaultKeyPaths()) {
        this._jwtConfig = auth_1.getJwtConfig();
        this[types_1.ASYNC_INIT] = key_pairs_1.loadKeys(keyPaths, false).then(keys => {
            this._keys = keys;
        });
        this._usersModel = usersModel;
    }
    generateAccessToken(user) {
        return jwt.sign({
            id: user.userId,
        }, this._keys.accessToken.privateKey, {
            algorithm: 'RS512',
            expiresIn: this._jwtConfig.expiration.accessToken,
            issuer: this._jwtConfig.issuer,
        });
    }
    generateRefreshToken(user) {
        return jwt.sign({
            id: user.userId,
        }, this._keys.refreshToken.privateKey, {
            algorithm: 'RS512',
            expiresIn: this._jwtConfig.expiration.refreshToken,
            issuer: this._jwtConfig.issuer,
        });
    }
    decodeAccessToken(token, ignoreExpiration = false) {
        return jwt.verify(token, this._keys.accessToken.publicKey, {
            ignoreExpiration,
            algorithms: ['RS512'],
            issuer: this._jwtConfig.issuer,
        });
    }
    decodeRefreshToken(token, ignoreExpiration = false) {
        return jwt.verify(token, this._keys.accessToken.publicKey, {
            ignoreExpiration,
            algorithms: ['RS512'],
            issuer: this._jwtConfig.issuer,
        });
    }
    getUserFromRequestByAccessToken(request, ignoreExpiration = false) {
        return this.getUserFromAccessToken(auth_1.getTokenFromRequest(request), ignoreExpiration);
    }
    getUserFromAccessTokenString(str, ignoreExpiration = false) {
        return this.getUserFromAccessToken(auth_1.getTokenFromString(str), ignoreExpiration);
    }
    async getUserFromAccessToken(token, ignoreExpiration = false) {
        const { id: userId } = this.decodeAccessToken(token, ignoreExpiration);
        const users = await this._usersModel.table.where({ userId }).select(); // FIXME: add method for retrieving
        if (users.length === 0) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.AUTH_BAD);
        }
        return users[0];
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