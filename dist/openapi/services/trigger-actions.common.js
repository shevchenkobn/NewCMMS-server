"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const trigger_actions_model_1 = require("../../models/trigger-actions.model");
const error_service_1 = require("../../services/error.service");
const common_1 = require("../../utils/common");
const model_1 = require("../../utils/model");
let TriggerActionsCommon = class TriggerActionsCommon {
    constructor(triggerActionsModel) {
        this.triggerActionsModel = triggerActionsModel;
    }
    createTriggerAction(triggerAction, returning) {
        return (returning
            ? this.triggerActionsModel.createOne(triggerAction, returning)
            : this.triggerActionsModel.createOne(triggerAction));
    }
    async getTriggerActions(params) {
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
            triggerActionIds: args.triggerActionIds,
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
        const triggerActions = await this.triggerActionsModel.getList(modelParams);
        if (cursor) {
            if (args.generateCursor) {
                cursor.updateFromList(triggerActions);
            }
            cursor.removeIrrelevantFromList(triggerActions);
        }
        if (modelParams.select
            && args.select
            && modelParams.select.length !== args.select.length) {
            common_1.deletePropsFromArray(triggerActions, common_1.differenceArrays(modelParams.select, args.select));
        }
        return {
            triggerActions,
            cursor: args.generateCursor && cursor
                ? cursor.toString()
                : null,
        };
    }
    async getTriggerAction(triggerActionId, select) {
        const triggerAction = await (!select || select.length === 0
            ? this.triggerActionsModel.getOne(triggerActionId)
            : this.triggerActionsModel.getOne(triggerActionId, select));
        if (!triggerAction) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return triggerAction;
    }
    async updateTriggerAction(triggerActionId, update, select) {
        const triggerAction = await (select
            ? this.triggerActionsModel.updateOne(triggerActionId, update, select)
            : this.triggerActionsModel.updateOne(triggerActionId, update));
        if (!triggerAction) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return triggerAction;
    }
    async deleteTriggerAction(triggerActionId, select) {
        const triggerAction = await (select
            ? this.triggerActionsModel.deleteOne(triggerActionId, select)
            : this.triggerActionsModel.deleteOne(triggerActionId));
        if (!triggerAction) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return triggerAction;
    }
};
TriggerActionsCommon = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(trigger_actions_model_1.TriggerActionsModel)),
    tslib_1.__metadata("design:paramtypes", [trigger_actions_model_1.TriggerActionsModel])
], TriggerActionsCommon);
exports.TriggerActionsCommon = TriggerActionsCommon;
//# sourceMappingURL=trigger-actions.common.js.map