"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const user_trigger_history_model_1 = require("../../models/user-trigger-history.model");
const users_model_1 = require("../../models/users.model");
const error_service_1 = require("../../services/error.service");
let UserTriggerHistoryCommon = class UserTriggerHistoryCommon {
    constructor(userTriggerHistoryModel, usersModel) {
        this.userTriggerHistoryModel = userTriggerHistoryModel;
        this.usersModel = usersModel;
    }
    async getUserTriggers(userId) {
        if (!await this.usersModel.getOne({ userId })) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return {
            userTriggers: await this.userTriggerHistoryModel.getList({
                userIds: [userId],
            }),
            cursor: null,
        };
    }
    async getUserTrigger(userId, userTriggerId) {
        const userTrigger = await this.userTriggerHistoryModel.getOne(userTriggerId, userId);
        if (!userTrigger) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return userTrigger;
    }
    async deleteUserTrigger(userId, userTriggerId) {
        const userTrigger = await this.userTriggerHistoryModel.deleteOne(userTriggerId, userId);
        if (!userTrigger) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return userTrigger;
    }
};
UserTriggerHistoryCommon = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(user_trigger_history_model_1.UserTriggerHistoryModel)),
    tslib_1.__param(1, inversify_1.inject(users_model_1.UsersModel)),
    tslib_1.__metadata("design:paramtypes", [user_trigger_history_model_1.UserTriggerHistoryModel,
        users_model_1.UsersModel])
], UserTriggerHistoryCommon);
exports.UserTriggerHistoryCommon = UserTriggerHistoryCommon;
//# sourceMappingURL=user-trigger-history.common.js.map