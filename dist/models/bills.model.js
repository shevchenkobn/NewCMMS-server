"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const pg_error_enum_1 = require("pg-error-enum");
const db_connection_class_1 = require("../services/db-connection.class");
const error_service_1 = require("../services/error.service");
const db_orchestrator_1 = require("../utils/db-orchestrator");
const model_1 = require("../utils/model");
const bills_1 = require("../utils/models/bills");
const action_devices_model_1 = require("./action-devices.model");
const bill_rates_model_1 = require("./bill-rates.model");
let BillsModel = class BillsModel {
    constructor(dbConnection, billRatesModel, actionDevicesModel) {
        this._dbConnection = dbConnection;
        this._billRatesModel = billRatesModel;
        this._actionDevicesModel = actionDevicesModel;
        switch (this._dbConnection.config.client) {
            case 'pg':
                this._handleError = err => {
                    switch (err.code) {
                        case pg_error_enum_1.PostgresError.FOREIGN_KEY_VIOLATION:
                            const detailLower = err.detail.toLowerCase();
                            if (detailLower.includes('triggerdeviceid')) {
                                throw new error_service_1.LogicError(error_service_1.ErrorCode.BILL_TRIGGER_DEVICE_ID_BAD);
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
        return this._dbConnection.knex(db_orchestrator_1.TableName.BILLS);
    }
    getList(params = {}) {
        const query = this.table;
        if (params.billIds && params.billIds.length > 0) {
            query.whereIn(db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.BILLS), params.billIds.slice());
        }
        if (params.comparatorFilters && params.comparatorFilters.length > 0) {
            for (const filter of params.comparatorFilters) {
                query.where(...filter);
            }
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
            : bills_1.getAllBillPropertyNames()));
    }
    getOne(billId) {
        return this.table.where({ billId })
            .then(bills => bills.length === 0 ? null : bills[0])
            .catch(this._handleError);
    }
    getLastForTriggerDevice(triggerDeviceId, returning = bills_1.getAllBillPropertyNames()) {
        return this.table.where({
            triggerDeviceId,
            finishedAt: null,
        })
            .orderBy('startedAt', 'desc')
            .first(returning)
            .then(bill => bill || null);
    }
    createOneWithBillRates(bill, transaction) {
        let newBillPromise;
        if (transaction) {
            newBillPromise = this.createOne(bill, transaction).then(bill => this.createBillRates(transaction, bill.triggerDeviceId)
                .then(() => bill)).catch(transaction.rollback);
        }
        else {
            newBillPromise = this._dbConnection.knex.transaction(trx => {
                newBillPromise = this.createOne(bill, transaction).then(bill => this.createBillRates(trx, bill.triggerDeviceId)
                    .then(() => trx.commit(bill))).catch(trx.rollback);
            });
        }
        return newBillPromise;
    }
    createOne(bill, transaction, returning) {
        const query = this.table.insert(bill, returning);
        if (transaction) {
            query.transacting(transaction);
        }
        return query
            .then(bills => {
            if (!returning || returning.length === 0) {
                return {};
            }
            return bills[0];
        })
            .catch(this._handleError);
    }
    updateOne(billId, update, returning) {
        return this.table.where({ billId })
            .update(update, returning)
            .then(bills => {
            if (!returning || returning.length === 0) {
                return bills === 0 ? null : {};
            }
            return bills.length === 0 ? null : bills[0];
        })
            .catch(this._handleError);
    }
    deleteOne(billId, returning) {
        return this.table.where({ billId }).delete(returning)
            .then(bills => {
            if (!returning || returning.length === 0) {
                return bills === 0 ? null : {};
            }
            return bills.length === 0 ? null : bills[0];
        })
            .catch(this._handleError);
    }
    createBillRates(trx, triggerDeviceId) {
        const actionDeviceIdName = db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.ACTION_DEVICES);
        const actionDeviceIdColumn = `${db_orchestrator_1.TableName.ACTION_DEVICES}.${actionDeviceIdName}`;
        return this._actionDevicesModel.table
            .innerJoin(db_orchestrator_1.TableName.TRIGGER_ACTIONS, actionDeviceIdColumn, `${db_orchestrator_1.TableName.TRIGGER_ACTIONS}.${actionDeviceIdName}`)
            .innerJoin(db_orchestrator_1.TableName.TRIGGER_DEVICES, `${db_orchestrator_1.TableName.TRIGGER_ACTIONS}.${db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.TRIGGER_DEVICES)}`, `${db_orchestrator_1.TableName.TRIGGER_DEVICES}.${db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.TRIGGER_DEVICES)}`)
            .where(db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.TRIGGER_DEVICES), triggerDeviceId)
            .select(`${actionDeviceIdColumn} as ${actionDeviceIdName}`, `${db_orchestrator_1.TableName.ACTION_DEVICES}.hourlyRate as hourlyRate`)
            .then(actionDevices => this._billRatesModel.createMany(actionDevices, trx)
            .catch(trx.rollback));
    }
};
BillsModel = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(db_connection_class_1.DbConnection)),
    tslib_1.__param(1, inversify_1.inject(bill_rates_model_1.BillRatesModel)),
    tslib_1.__param(2, inversify_1.inject(action_devices_model_1.ActionDevicesModel)),
    tslib_1.__metadata("design:paramtypes", [db_connection_class_1.DbConnection,
        bill_rates_model_1.BillRatesModel,
        action_devices_model_1.ActionDevicesModel])
], BillsModel);
exports.BillsModel = BillsModel;
//# sourceMappingURL=bills.model.js.map