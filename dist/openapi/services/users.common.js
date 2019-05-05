"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const users_model_1 = require("../../models/users.model");
let UsersCommon = class UsersCommon {
    constructor(usersModel) {
        this.usersModel = usersModel;
    }
    createUser(user, returning) {
        const userSeed = { ...user };
        if (!userSeed.password) {
            delete userSeed.password;
        }
        return returning
            ? this.usersModel.createOne(userSeed, returning)
            : this.usersModel.createOne(userSeed);
    }
};
UsersCommon = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(users_model_1.UsersModel)),
    tslib_1.__metadata("design:paramtypes", [users_model_1.UsersModel])
], UsersCommon);
exports.UsersCommon = UsersCommon;
//# sourceMappingURL=users.common.js.map