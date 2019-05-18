"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const events_1 = require("events");
const inversify_1 = require("inversify");
const iterare_1 = require("iterare");
const ts_optchain_1 = require("ts-optchain");
const types_1 = require("../di/types");
const action_devices_model_1 = require("../models/action-devices.model");
const bill_rates_model_1 = require("../models/bill-rates.model");
const bills_model_1 = require("../models/bills.model");
const trigger_actions_model_1 = require("../models/trigger-actions.model");
const trigger_devices_model_1 = require("../models/trigger-devices.model");
const user_trigger_history_model_1 = require("../models/user-trigger-history.model");
const auth_service_1 = require("../services/auth.service");
const db_connection_class_1 = require("../services/db-connection.class");
const error_service_1 = require("../services/error.service");
const common_1 = require("../utils/common");
const action_devices_1 = require("../utils/models/action-devices");
const trigger_devices_1 = require("../utils/models/trigger-devices");
const user_trigger_history_1 = require("../utils/models/user-trigger-history");
const openapi_1 = require("../utils/openapi");
var ActionDeviceAction;
(function (ActionDeviceAction) {
    ActionDeviceAction[ActionDeviceAction["TOGGLE"] = 0] = "TOGGLE";
    ActionDeviceAction[ActionDeviceAction["TURN_ON"] = 1] = "TURN_ON";
    ActionDeviceAction[ActionDeviceAction["TURN_OFF"] = 2] = "TURN_OFF";
})(ActionDeviceAction = exports.ActionDeviceAction || (exports.ActionDeviceAction = {}));
var ProcessTriggerResults;
(function (ProcessTriggerResults) {
    ProcessTriggerResults[ProcessTriggerResults["TRIGGER_DEVICE_DISCONNECTED"] = 0] = "TRIGGER_DEVICE_DISCONNECTED";
    ProcessTriggerResults[ProcessTriggerResults["ENTER_ADDED_WITHOUT_ACTIONS_TOGGLED"] = 1] = "ENTER_ADDED_WITHOUT_ACTIONS_TOGGLED";
    ProcessTriggerResults[ProcessTriggerResults["LEAVE_ADDED_WITHOUT_ACTIONS_TOGGLED"] = 2] = "LEAVE_ADDED_WITHOUT_ACTIONS_TOGGLED";
    ProcessTriggerResults[ProcessTriggerResults["ACTIONS_TOGGLED"] = 4] = "ACTIONS_TOGGLED";
    ProcessTriggerResults[ProcessTriggerResults["ENTER_ADDED"] = 5] = "ENTER_ADDED";
    ProcessTriggerResults[ProcessTriggerResults["LEAVE_ADDED"] = 6] = "LEAVE_ADDED";
})(ProcessTriggerResults = exports.ProcessTriggerResults || (exports.ProcessTriggerResults = {}));
types_1.ensureInjectable(events_1.EventEmitter);
let IoTService = class IoTService extends events_1.EventEmitter {
    constructor(authService, dbConnection, triggerDevicesModel, actionDevicesModel, triggerActionsModel, billsModel, billRatesModel, userTriggerHistoryModel) {
        super();
        this.authService = authService;
        this.dbConnection = dbConnection;
        this.triggerDevicesModel = triggerDevicesModel;
        this.actionDevicesModel = actionDevicesModel;
        this.triggerActionsModel = triggerActionsModel;
        this.billsModel = billsModel;
        this.billRatesModel = billRatesModel;
        this.userTriggerHistoryModel = userTriggerHistoryModel;
    }
    async processTrigger(triggerDeviceMac, userToken, userTriggerType = user_trigger_history_1.UserTriggerType.UNSPECIFIED) {
        // Validate MAC and get the device
        if (!common_1.isPhysicalAddress(triggerDeviceMac)) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.MAC_INVALID);
        }
        const triggerDevice = await this.triggerDevicesModel.getOne({ physicalAddress: triggerDeviceMac });
        if (!triggerDevice) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        if (triggerDevice.status === trigger_devices_1.TriggerDeviceStatus.DISCONNECTED) {
            return ProcessTriggerResults.TRIGGER_DEVICE_DISCONNECTED;
        }
        const user = await this.authService.getUserFromAccessToken(userToken, [openapi_1.JwtBearerScope.EMPLOYEE]);
        const dateTriggered = new Date();
        const userTriggers = await this.userTriggerHistoryModel
            .getListForLastBill(triggerDevice.triggerDeviceId);
        let billRates;
        let triggerType;
        if (userTriggers.length === 0) { // no opened bills
            triggerType = userTriggerType !== user_trigger_history_1.UserTriggerType.UNSPECIFIED
                ? userTriggerType
                : user_trigger_history_1.UserTriggerType.ENTER;
            // Create bill and first user trigger
            await this.dbConnection.knex.transaction(trx => {
                Promise.join(this.userTriggerHistoryModel.createOne({
                    triggerType,
                    userId: user.userId,
                    triggerTime: dateTriggered,
                    triggerDeviceId: triggerDevice.triggerDeviceId,
                }, trx), this.billsModel.createOneWithBillRates({
                    triggerDeviceId: triggerDevice.triggerDeviceId,
                    startedAt: dateTriggered,
                    finishedAt: null,
                    sum: '0',
                }, trx)).then(trx.commit).catch(trx.rollback);
            });
        }
        else {
            const groupedTriggers = groupUserTriggersByUserIdAndType(userTriggers);
            triggerType = userTriggerType !== user_trigger_history_1.UserTriggerType.UNSPECIFIED
                ? userTriggerType
                : (isEnterTrigger(groupedTriggers, user.userId)
                    ? user_trigger_history_1.UserTriggerType.ENTER
                    : user_trigger_history_1.UserTriggerType.LEAVE);
            switch (triggerType) {
                case user_trigger_history_1.UserTriggerType.ENTER:
                    {
                        // Just add trigger to db
                        await this.userTriggerHistoryModel.createOne({
                            triggerType,
                            userId: user.userId,
                            triggerTime: dateTriggered,
                            triggerDeviceId: triggerDevice.triggerDeviceId,
                        });
                    }
                    break;
                case user_trigger_history_1.UserTriggerType.LEAVE:
                    {
                        // Check if everyone has exited. If true update the bill
                        if (hasLastExited(groupedTriggers)) {
                            const results = await Promise.all([
                                this.billRatesModel.getListForTriggerDevice(triggerDeviceMac),
                                this.billsModel.getLastForTriggerDevice(triggerDevice.triggerDeviceId),
                            ]);
                            billRates = results[0];
                            const bill = results[1];
                            if (!bill) {
                                throw new TypeError('Unexpected absent bill');
                            }
                            const sum = await this.billRatesModel.getBillSumForTriggerDevice(triggerDeviceMac, bill.startedAt, dateTriggered);
                            await this.dbConnection.knex.transaction(trx => {
                                Promise.join(this.billsModel.updateOne(bill.billId, {
                                    sum,
                                    finishedAt: dateTriggered,
                                }), this.userTriggerHistoryModel.createOne({
                                    triggerType,
                                    userId: user.userId,
                                    triggerTime: dateTriggered,
                                    triggerDeviceId: triggerDevice.triggerDeviceId,
                                }, trx)).then(trx.commit).then(trx.rollback);
                            });
                        }
                        else {
                            await this.userTriggerHistoryModel.createOne({
                                triggerType,
                                userId: user.userId,
                                triggerTime: dateTriggered,
                                triggerDeviceId: triggerDevice.triggerDeviceId,
                            });
                        }
                    }
                    break;
            }
        }
        if (!billRates) {
            billRates = await this.billRatesModel.getListForTriggerDevice(triggerDeviceMac);
        }
        if (billRates.length === 0) {
            return triggerType === user_trigger_history_1.UserTriggerType.ENTER
                ? ProcessTriggerResults.ENTER_ADDED_WITHOUT_ACTIONS_TOGGLED
                : ProcessTriggerResults.LEAVE_ADDED_WITHOUT_ACTIONS_TOGGLED;
        }
        // Do the actions
        const actionDevices = await this.actionDevicesModel.getList({
            actionDeviceIds: iterare_1.iterate(billRates)
                .filter(rate => typeof rate.actionDeviceId === 'number')
                .map(rate => rate.actionDeviceId).toArray(),
            statuses: [action_devices_1.ActionDeviceStatus.CONNECTED, action_devices_1.ActionDeviceStatus.ONLINE],
        });
        for (const device of actionDevices) {
            // FIXME: choose action according to status
            this.emit('action-device/toggle', device, ActionDeviceAction.TOGGLE);
        }
        return triggerType === user_trigger_history_1.UserTriggerType.ENTER
            ? ProcessTriggerResults.ENTER_ADDED
            : ProcessTriggerResults.LEAVE_ADDED;
    }
};
IoTService = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(auth_service_1.AuthService)),
    tslib_1.__param(1, inversify_1.inject(db_connection_class_1.DbConnection)),
    tslib_1.__param(2, inversify_1.inject(trigger_devices_model_1.TriggerDevicesModel)),
    tslib_1.__param(3, inversify_1.inject(action_devices_model_1.ActionDevicesModel)),
    tslib_1.__param(4, inversify_1.inject(trigger_actions_model_1.TriggerActionsModel)),
    tslib_1.__param(5, inversify_1.inject(bills_model_1.BillsModel)),
    tslib_1.__param(6, inversify_1.inject(bill_rates_model_1.BillRatesModel)),
    tslib_1.__param(7, inversify_1.inject(user_trigger_history_model_1.UserTriggerHistoryModel)),
    tslib_1.__metadata("design:paramtypes", [auth_service_1.AuthService,
        db_connection_class_1.DbConnection,
        trigger_devices_model_1.TriggerDevicesModel,
        action_devices_model_1.ActionDevicesModel,
        trigger_actions_model_1.TriggerActionsModel,
        bills_model_1.BillsModel,
        bill_rates_model_1.BillRatesModel,
        user_trigger_history_model_1.UserTriggerHistoryModel])
], IoTService);
exports.IoTService = IoTService;
function hasLastExited(map) {
    return iterare_1.iterate(map.values()).every(map => ((!map.has(user_trigger_history_1.UserTriggerType.ENTER) && !map.has(user_trigger_history_1.UserTriggerType.LEAVE))
        || (map.has(user_trigger_history_1.UserTriggerType.ENTER) && map.has(user_trigger_history_1.UserTriggerType.LEAVE)
            && map.get(user_trigger_history_1.UserTriggerType.ENTER).length ===
                map.get(user_trigger_history_1.UserTriggerType.LEAVE).length)));
}
function isEnterTrigger(map, userId) {
    return !map.has(userId) || hasUserLeft(map.get(userId));
}
function groupUserTriggersByUserIdAndType(userTriggers) {
    const map = new Map();
    for (const trigger of userTriggers) {
        if (map.has(trigger.userId)) {
            const nestedMap = map.get(trigger.userId);
            if (nestedMap.has(trigger.triggerType)) {
                nestedMap.get(trigger.triggerType).push(trigger);
            }
            else {
                nestedMap.set(trigger.triggerType, [trigger]);
            }
        }
        else {
            map.set(trigger.userId, new Map([
                [trigger.triggerType, [trigger]],
            ]));
        }
    }
    return map;
}
function hasUserLeft(map) {
    const enteredCount = (map.get(user_trigger_history_1.UserTriggerType.ENTER) != null && map.get(user_trigger_history_1.UserTriggerType.ENTER).length != null ? map.get(user_trigger_history_1.UserTriggerType.ENTER).length : undefined) || 0;
    const leftCount = (map.get(user_trigger_history_1.UserTriggerType.LEAVE) != null && map.get(user_trigger_history_1.UserTriggerType.LEAVE).length != null ? map.get(user_trigger_history_1.UserTriggerType.LEAVE).length : undefined) || 0;
    if (enteredCount === leftCount) {
        return true;
    }
    if (enteredCount === leftCount + 1) {
        return false;
    }
    throw new TypeError(`Unexpected count: enteredCount = ${enteredCount}; leftCount = ${leftCount}`);
}
//# sourceMappingURL=service.js.map