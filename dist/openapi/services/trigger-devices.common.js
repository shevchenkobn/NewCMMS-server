"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const trigger_devices_model_1 = require("../../models/trigger-devices.model");
const error_service_1 = require("../../services/error.service");
const common_1 = require("../../utils/common");
const model_1 = require("../../utils/model");
let TriggerDevicesCommon = class TriggerDevicesCommon {
    constructor(triggerDevicesModel) {
        this.triggerDevicesModel = triggerDevicesModel;
    }
    createTriggerDevice(device, returning) {
        return (returning
            ? this.triggerDevicesModel.createOne(device, returning)
            : this.triggerDevicesModel.createOne(device));
    }
    async getTriggerDevices(params) {
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
            triggerDeviceIds: args.triggerDeviceIds,
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
        const devices = await this.triggerDevicesModel.getList(modelParams);
        if (cursor) {
            if (args.generateCursor) {
                cursor.updateFromList(devices);
            }
            cursor.removeIrrelevantFromList(devices);
        }
        if (modelParams.select
            && args.select
            && modelParams.select.length !== args.select.length) {
            const propsToDelete = common_1.differenceArrays(modelParams.select, args.select);
            for (const device of devices) {
                for (const prop of propsToDelete) {
                    delete device[prop];
                }
            }
        }
        return {
            triggerDevices: devices,
            cursor: args.generateCursor && cursor
                ? cursor.toString()
                : null,
        };
    }
    async getTriggerDevice(triggerDeviceId, select) {
        const device = await (!select || select.length === 0
            ? this.triggerDevicesModel.getOne({ triggerDeviceId })
            : this.triggerDevicesModel.getOne({ triggerDeviceId }, select));
        if (!device) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return device;
    }
    async updateTriggerDevice(triggerDeviceId, update, select) {
        const device = await (select
            ? this.triggerDevicesModel.updateOne(triggerDeviceId, update, select)
            : this.triggerDevicesModel.updateOne(triggerDeviceId, update));
        if (!device) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return device;
    }
    async deleteTriggerDevice(triggerDeviceId, select) {
        const device = await (select
            ? this.triggerDevicesModel.deleteOne(triggerDeviceId, select)
            : this.triggerDevicesModel.deleteOne(triggerDeviceId));
        if (!device) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return device;
    }
};
TriggerDevicesCommon = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(trigger_devices_model_1.TriggerDevicesModel)),
    tslib_1.__metadata("design:paramtypes", [trigger_devices_model_1.TriggerDevicesModel])
], TriggerDevicesCommon);
exports.TriggerDevicesCommon = TriggerDevicesCommon;
//# sourceMappingURL=trigger-devices.common.js.map