"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const users_model_1 = require("../../models/users.model");
const db_orchestrator_class_1 = require("../../services/db-orchestrator.class");
const error_service_1 = require("../../services/error.service");
const common_1 = require("../../utils/common");
const model_1 = require("../../utils/model");
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
    async getUsers(params) {
        const args = Object.assign({ generateCursor: true }, params);
        let cursor = null;
        if (args.sort) {
            cursor = new model_1.PaginationCursor(args.sort, args.cursor);
        }
        else {
            if (args.cursor) {
                throw new error_service_1.LogicError(error_service_1.ErrorCode.SORT_NO);
            }
        }
        const modelParams = {
            userIds: args.userIds,
            orderBy: args.sort,
            offset: args.skip,
            limit: args.limit,
        };
        if (args.select) {
            modelParams.select = cursor
                ? common_1.mergeArrays(args.select, cursor.getFilteredFieldNames())
                : args.select;
        }
        if (cursor) {
            modelParams.comparatorFilters = cursor.filterField
                ? [cursor.filterField]
                : [];
        }
        const users = await this.usersModel.getList(modelParams);
        if (cursor) {
            if (args.generateCursor) {
                cursor.updateFromList(users);
            }
            cursor.removeIrrelevantFromList(users);
        }
        if (modelParams.select
            && args.select
            && modelParams.select.length !== args.select.length) {
            const propsToDelete = common_1.differenceArrays(modelParams.select, args.select);
            for (const user of users) {
                for (const prop of propsToDelete) {
                    delete user[prop];
                }
            }
        }
        return {
            users,
            cursor: args.generateCursor && cursor
                ? cursor.toString()
                : null,
        };
    }
    async getUser(id, select) {
        const user = await (!select || select.length === 0
            ? this.usersModel.getOne({ userId: id })
            : this.usersModel.getOne({ userId: id }, select));
        if (!user) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return user;
    }
    async deleteUser(userId, select) {
        if (userId === db_orchestrator_class_1.superAdminId) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.AUTH_ROLE);
        }
        const returnUser = select && select.length > 0;
        let user;
        if (returnUser) {
            user = await this.usersModel.getOne({ userId }, select);
            if (!user) {
                throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
            }
        }
        const result = await this.usersModel.deleteOne({ userId });
        if (!result) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        if (user) {
            return user;
        }
        return {};
    }
    updateUser(userId, update, select) {
        return select
            ? this.usersModel.updateOne(userId, update, select)
            : this.usersModel.updateOne(userId, update);
    }
};
UsersCommon = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(users_model_1.UsersModel)),
    tslib_1.__metadata("design:paramtypes", [users_model_1.UsersModel])
], UsersCommon);
exports.UsersCommon = UsersCommon;
//# sourceMappingURL=users.common.js.map