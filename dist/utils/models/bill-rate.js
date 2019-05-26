"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getAllSafeBillRatePropertyNames() {
    return ['actionDeviceId', 'hourlyRate'];
}
exports.getAllSafeBillRatePropertyNames = getAllSafeBillRatePropertyNames;
function getAllBillRateFromDbPropertyNames() {
    return getAllSafeBillRatePropertyNames().concat('billId');
}
exports.getAllBillRateFromDbPropertyNames = getAllBillRateFromDbPropertyNames;
//# sourceMappingURL=bill-rate.js.map