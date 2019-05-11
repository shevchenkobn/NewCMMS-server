"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const db_connection_class_1 = require("../services/db-connection.class");
const error_service_1 = require("../services/error.service");
const db_orchestrator_1 = require("../utils/db-orchestrator");
const model_1 = require("../utils/model");
const trigger_devices_1 = require("../utils/models/trigger-devices");
let TriggerDevicesModel = class TriggerDevicesModel {
    constructor(dbConnection) {
        this._dbConnection = dbConnection;
        switch (this._dbConnection.config.client) {
            case 'pg':
                this._handleError = err => {
                    switch (err.code) {
                        case '23505':
                            const detailLower = err.detail.toLowerCase();
                            if (detailLower.includes('name')) {
                                throw new error_service_1.LogicError(error_service_1.ErrorCode.TRIGGER_DEVICE_NAME_DUPLICATE);
                            }
                            if (detailLower.includes('physicalAddress')) {
                                throw new error_service_1.LogicError(error_service_1.ErrorCode.TRIGGER_DEVICE_MAC_DUPLICATE);
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
        return this._dbConnection.knex(db_orchestrator_1.TableName.TRIGGER_DEVICES);
    }
    getList(params) {
        const query = this.table;
        if (params.triggerDeviceIds && params.triggerDeviceIds.length > 0) {
            query.whereIn(db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.TRIGGER_DEVICES), params.triggerDeviceIds.slice());
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
            : trigger_devices_1.getAllTriggerDevicePropertyNames()));
    }
    async getOne(nameOrTriggerDeviceId, select = trigger_devices_1.getAllTriggerDevicePropertyNames()) {
        if (!trigger_devices_1.isValidTriggerDeviceUniqueIdentifier(nameOrTriggerDeviceId)) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.TRIGGER_DEVICE_ID_AND_NAME, 'Both id and name present. Use only one of them.');
        }
        const users = await this.table.where(nameOrTriggerDeviceId)
            .select(select);
        if (users.length === 0) {
            return null;
        }
        return users[0];
    }
    createOne(triggerDevice, returning) {
        const returnNew = returning && returning.length > 0;
        return this.table.insert(triggerDevice, returning)
            .then(devices => {
            if (!returnNew) {
                return {};
            }
            return devices[0];
        })
            .catch(this._handleError);
    }
    updateOne(triggerDeviceId, update, returning) {
        return this.table.where({ triggerDeviceId })
            .update(update, returning)
            .then(devices => {
            if (!returning || returning.length === 0) {
                return devices === 0 ? null : {};
            }
            return devices.length === 0 ? null : devices[0];
        })
            .catch(this._handleError);
    }
    deleteOne(triggerDeviceId, returning) {
        return this.table.where({ triggerDeviceId }).delete(returning)
            .then(devices => {
            if (!returning || returning.length === 0) {
                return devices === 0 ? null : {};
            }
            return devices.length === 0 ? null : devices[0];
        });
    }
};
TriggerDevicesModel = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(db_connection_class_1.DbConnection)),
    tslib_1.__metadata("design:paramtypes", [db_connection_class_1.DbConnection])
], TriggerDevicesModel);
exports.TriggerDevicesModel = TriggerDevicesModel;
//# sourceMappingURL=trigger-devices.model.js.map