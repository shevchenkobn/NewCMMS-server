"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const bills_model_1 = require("../models/bills.model");
const trigger_actions_model_1 = require("../models/trigger-actions.model");
const bill_rates_model_1 = require("../models/bill-rates.model");
const auth_service_1 = require("../services/auth.service");
const trigger_devices_model_1 = require("../models/trigger-devices.model");
let IoTService = class IoTService {
    constructor(authService, triggerDevicesModel, triggerActionsModel, billsModel, billRatesModel) {
        this.authService = authService;
        this.triggerDevicesModel = triggerDevicesModel;
        this.triggerActionsModel = triggerActionsModel;
        this.billsModel = billsModel;
        this.billRatesModel = billRatesModel;
    }
};
IoTService = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(auth_service_1.AuthService)),
    tslib_1.__param(1, inversify_1.inject(trigger_devices_model_1.TriggerDevicesModel)),
    tslib_1.__param(2, inversify_1.inject(trigger_actions_model_1.TriggerActionsModel)),
    tslib_1.__param(3, inversify_1.inject(bills_model_1.BillsModel)),
    tslib_1.__param(4, inversify_1.inject(bill_rates_model_1.BillRatesModel)),
    tslib_1.__metadata("design:paramtypes", [auth_service_1.AuthService,
        trigger_devices_model_1.TriggerDevicesModel,
        trigger_actions_model_1.TriggerActionsModel,
        bills_model_1.BillsModel,
        bill_rates_model_1.BillRatesModel])
], IoTService);
exports.IoTService = IoTService;
//# sourceMappingURL=service.js.map