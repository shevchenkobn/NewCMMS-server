"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const action_devices_model_1 = require("../../models/action-devices.model");
const error_service_1 = require("../../services/error.service");
const common_1 = require("../../utils/common");
const model_1 = require("../../utils/model");
let ActionDevicesCommon = class ActionDevicesCommon {
    constructor(actionDevicesModel) {
        this.actionDevicesModel = actionDevicesModel;
    }
    createActionDevice(device, returning) {
        return (returning
            ? this.actionDevicesModel.createOne(device, returning)
            : this.actionDevicesModel.createOne(device));
    }
    async getActionDevices(params) {
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
            actionDeviceIds: args.actionDeviceIds,
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
        const devices = await this.actionDevicesModel.getList(modelParams);
        if (cursor) {
            if (args.generateCursor) {
                cursor.updateFromList(devices);
            }
            cursor.removeIrrelevantFromList(devices);
        }
        if (modelParams.select
            && args.select
            && modelParams.select.length !== args.select.length) {
            common_1.deletePropsFromArray(devices, common_1.differenceArrays(modelParams.select, args.select));
        }
        return {
            actionDevices: devices,
            cursor: args.generateCursor && cursor
                ? cursor.toString()
                : null,
        };
    }
    async getActionDevice(actionDeviceId, select) {
        const device = await (!select || select.length === 0
            ? this.actionDevicesModel.getOne(actionDeviceId)
            : this.actionDevicesModel.getOne(actionDeviceId, select));
        if (!device) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return device;
    }
    async updateActionDevice(actionDeviceId, update, select) {
        const device = await (select
            ? this.actionDevicesModel.updateOne(actionDeviceId, update, select)
            : this.actionDevicesModel.updateOne(actionDeviceId, update));
        if (!device) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return device;
    }
    async deleteActionDevice(actionDeviceId, select) {
        const device = await (select
            ? this.actionDevicesModel.deleteOne(actionDeviceId, select)
            : this.actionDevicesModel.deleteOne(actionDeviceId));
        if (!device) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return device;
    }
};
ActionDevicesCommon = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(action_devices_model_1.ActionDevicesModel)),
    tslib_1.__metadata("design:paramtypes", [action_devices_model_1.ActionDevicesModel])
], ActionDevicesCommon);
exports.ActionDevicesCommon = ActionDevicesCommon;
//# sourceMappingURL=action-devices.common.js.map