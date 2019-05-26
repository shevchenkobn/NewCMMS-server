"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const bill_rates_model_1 = require("../../models/bill-rates.model");
const bills_model_1 = require("../../models/bills.model");
const error_service_1 = require("../../services/error.service");
let BillRatesCommon = class BillRatesCommon {
    constructor(billRatesModel, billsModel) {
        this.billRatesModel = billRatesModel;
        this.billsModel = billsModel;
    }
    async getBillRatesForBill(billId) {
        if (!await this.billsModel.getOne(billId)) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return {
            billRates: await this.billRatesModel.getList({
                billIds: [billId],
            }),
            cursor: null,
        };
    }
};
BillRatesCommon = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(bill_rates_model_1.BillRatesModel)),
    tslib_1.__param(1, inversify_1.inject(bills_model_1.BillsModel)),
    tslib_1.__metadata("design:paramtypes", [bill_rates_model_1.BillRatesModel,
        bills_model_1.BillsModel])
], BillRatesCommon);
exports.BillRatesCommon = BillRatesCommon;
//# sourceMappingURL=bill-rates.common.js.map