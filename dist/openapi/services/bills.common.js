"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const bills_model_1 = require("../../models/bills.model");
const error_service_1 = require("../../services/error.service");
const bills_1 = require("../../utils/models/bills");
let BillsCommon = class BillsCommon {
    constructor(billsModel) {
        this.billsModel = billsModel;
    }
    async getBills() {
        return {
            bills: await this.billsModel.getList(),
            cursor: null,
        };
    }
    async getBill(billId) {
        const bill = await this.billsModel.getOne(billId);
        if (!bill) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return bill;
    }
    async deleteBill(billId) {
        const bill = await this.billsModel.deleteOne(billId, bills_1.getAllBillPropertyNames());
        if (!bill) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND);
        }
        return bill;
    }
};
BillsCommon = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(bills_model_1.BillsModel)),
    tslib_1.__metadata("design:paramtypes", [bills_model_1.BillsModel])
], BillsCommon);
exports.BillsCommon = BillsCommon;
//# sourceMappingURL=bills.common.js.map