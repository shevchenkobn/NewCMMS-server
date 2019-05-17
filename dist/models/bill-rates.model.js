"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const pg_error_enum_1 = require("pg-error-enum");
const db_connection_class_1 = require("../services/db-connection.class");
const error_service_1 = require("../services/error.service");
const db_orchestrator_1 = require("../utils/db-orchestrator");
const model_1 = require("../utils/model");
const bill_rate_1 = require("../utils/models/bill-rate");
let BillRatesModel = class BillRatesModel {
    constructor(dbConnection) {
        this._dbConnection = dbConnection;
        switch (this._dbConnection.config.client) {
            case 'pg':
                this._handleError = err => {
                    switch (err.code) {
                        case pg_error_enum_1.PostgresError.FOREIGN_KEY_VIOLATION: {
                            const detailLower = err.detail.toLowerCase();
                            if (detailLower.includes('actiondeviceid')) {
                                throw new error_service_1.LogicError(error_service_1.ErrorCode.BILL_RATE_ACTION_DEVICE_ID_BAD);
                            }
                        }
                        case pg_error_enum_1.PostgresError.INVALID_TEXT_REPRESENTATION: {
                            const detailLower = err.detail.toLowerCase();
                            if (detailLower.includes('"notmac"')) {
                                throw new error_service_1.LogicError(error_service_1.ErrorCode.MAC_INVALID);
                            }
                        }
                        default:
                            throw err;
                    }
                };
                break;
            default:
                throw new TypeError(`Cannot create handler for database errors for ${this._dbConnection.config.client}`);
        }
    }
    get table() {
        return this._dbConnection.knex(db_orchestrator_1.TableName.BILL_RATES);
    }
    getList(params) {
        const query = this.table;
        if (params.billIds && params.billIds.length > 0) {
            query.whereIn(db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.BILLS), params.billIds.slice());
        }
        if (typeof params.offset === 'number') {
            query.offset(params.offset);
        }
        if (typeof params.limit === 'number') {
            query.limit(params.limit);
        }
        if (params.orderBy && params.orderBy.length > 0) {
            model_1.applySortingToQuery(query, params.orderBy);
        }
        return query.select((params.select && params.select.length > 0
            ? params.select.slice()
            : bill_rate_1.getAllBillRateFromDbPropertyNames()));
    }
    getListForTriggerDevice(triggerDeviceMac) {
        return this.getSelectQueryForTriggerDevice(triggerDeviceMac)
            .catch(this._handleError);
    }
    getBillSumForTriggerDevice(triggerDeviceMac, startDate, endDate) {
        const hoursDiffClause = this._dbConnection.getDatesDiffInHours(endDate, startDate);
        return this._dbConnection.knex()
            .select(hoursDiffClause.wrap('sum(hourlyRate) * ', ' as sum'))
            .from(this.getSelectQueryForTriggerDevice(triggerDeviceMac))
            .catch(this._handleError)
            .then(sum => sum.sum);
    }
    createMany(billRates, transaction, returning) {
        return this.table.transacting(transaction)
            .insert(billRates, returning)
            .then(billRates => {
            if (!returning || returning.length === 0) {
                // tslint:disable-next-line:prefer-array-literal
                return new Array(billRates).map(() => ({}));
            }
            return billRates;
        })
            .catch(this._handleError);
    }
    deleteMany(billId, transaction, returning) {
        return this.table.where({ billId })
            .transacting(transaction)
            .delete(returning)
            .then(billRates => {
            if (!returning || returning.length === 0) {
                // tslint:disable-next-line:prefer-array-literal
                return new Array(billRates).map(() => ({}));
            }
            return billRates;
        })
            .catch(this._handleError);
    }
    getSelectQueryForTriggerDevice(triggerDeviceMac) {
        const actionDeviceId = db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.ACTION_DEVICES);
        const billRateActionDeviceId = `${db_orchestrator_1.TableName.BILL_RATES}.${actionDeviceId}`;
        const triggerDeviceId = db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.TRIGGER_DEVICES);
        return this.table.innerJoin(db_orchestrator_1.TableName.TRIGGER_ACTIONS, billRateActionDeviceId, `${db_orchestrator_1.TableName.TRIGGER_ACTIONS}.${actionDeviceId}`).innerJoin(db_orchestrator_1.TableName.TRIGGER_DEVICES, `${db_orchestrator_1.TableName.TRIGGER_ACTIONS}.${triggerDeviceId}`, `${db_orchestrator_1.TableName.TRIGGER_DEVICES}.${triggerDeviceId}`).where(`${db_orchestrator_1.TableName.TRIGGER_DEVICES}.physicalAddress`, triggerDeviceMac).select(`${billRateActionDeviceId} as ${actionDeviceId}`, `${db_orchestrator_1.TableName.BILL_RATES}.hourlyRate as hourlyRate`);
    }
};
BillRatesModel = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(db_connection_class_1.DbConnection)),
    tslib_1.__metadata("design:paramtypes", [db_connection_class_1.DbConnection])
], BillRatesModel);
exports.BillRatesModel = BillRatesModel;
//# sourceMappingURL=bill-rates.model.js.map