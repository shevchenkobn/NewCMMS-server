"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const db_connection_class_1 = require("../services/db-connection.class");
const error_service_1 = require("../services/error.service");
const db_orchestrator_1 = require("../utils/db-orchestrator");
const model_1 = require("../utils/model");
const action_devices_1 = require("../utils/models/action-devices");
let ActionDevicesModel = class ActionDevicesModel {
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
                            if (detailLower.includes('physicaladdress')) {
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
        return this._dbConnection.knex(db_orchestrator_1.TableName.ACTION_DEVICES);
    }
    getList(params) {
        const query = this.table;
        if (params.actionDeviceIds && params.actionDeviceIds.length > 0) {
            query.whereIn(db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.ACTION_DEVICES), params.actionDeviceIds.slice());
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
            : action_devices_1.getAllActionDevicePropertyNames()));
    }
    async getOne(actionDeviceId, select) {
        const devices = await this.table.where({ actionDeviceId })
            .select(select);
        if (devices.length === 0) {
            return null;
        }
        return devices[0];
    }
    createOne(actionDevice, returning) {
        return this.table.insert(actionDevice, returning)
            .then(devices => {
            if (!returning || returning.length === 0) {
                return {};
            }
            return devices[0];
        })
            .catch(this._handleError);
    }
    updateOne(actionDeviceId, update, returning) {
        return this.table.where({ actionDeviceId })
            .update(update, returning)
            .then(devices => {
            if (!returning || returning.length === 0) {
                return devices === 0 ? null : {};
            }
            return devices.length === 0 ? null : devices[0];
        });
    }
    deleteOne(actionDeviceId, returning) {
        return this.table.where({ actionDeviceId }).delete(returning)
            .then(devices => {
            if (!returning || returning.length === 0) {
                return devices === 0 ? null : {};
            }
            return devices.length === 0 ? null : devices[0];
        })
            .catch(this._handleError);
    }
};
ActionDevicesModel = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(db_connection_class_1.DbConnection)),
    tslib_1.__metadata("design:paramtypes", [db_connection_class_1.DbConnection])
], ActionDevicesModel);
exports.ActionDevicesModel = ActionDevicesModel;
//# sourceMappingURL=action-devices.model.js.map