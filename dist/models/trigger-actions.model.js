"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const pg_error_enum_1 = require("pg-error-enum");
const db_connection_class_1 = require("../services/db-connection.class");
const error_service_1 = require("../services/error.service");
const db_orchestrator_1 = require("../utils/db-orchestrator");
const model_1 = require("../utils/model");
const trigger_actions_1 = require("../utils/models/trigger-actions");
const action_devices_model_1 = require("./action-devices.model");
const trigger_devices_model_1 = require("./trigger-devices.model");
let TriggerActionsModel = class TriggerActionsModel {
    constructor(dbConnection, triggerDevicesModel, actionDevicesModel) {
        this._dbConnection = dbConnection;
        this._triggerDevicesModel = triggerDevicesModel;
        this._actionDevicesModel = actionDevicesModel;
        switch (this._dbConnection.config.client) {
            case 'pg':
                this._handleError = err => {
                    switch (err.code) {
                        case pg_error_enum_1.PostgresError.FOREIGN_KEY_VIOLATION:
                            const detailLower = err.detail.toLowerCase();
                            if (detailLower.includes('triggerdeviceid')) {
                                throw new error_service_1.LogicError(error_service_1.ErrorCode.TRIGGER_ACTION_TRIGGER_DEVICE_ID_BAD);
                            }
                            if (detailLower.includes('actiondeviceid')) {
                                throw new error_service_1.LogicError(error_service_1.ErrorCode.TRIGGER_ACTION_ACTION_DEVICE_ID_BAD);
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
        return this._dbConnection.knex(db_orchestrator_1.TableName.TRIGGER_ACTIONS);
    }
    async getList(params) {
        const query = this.table;
        if (params.triggerActionIds && params.triggerActionIds.length > 0) {
            query.whereIn(db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.TRIGGER_ACTIONS), params.triggerActionIds.slice());
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
            : trigger_actions_1.getAllTriggerActionPropertyNames()));
    }
    async getOne(triggerActionId, select) {
        const triggerActions = await this.table.where({ triggerActionId })
            .select(select);
        if (triggerActions.length === 0) {
            return null;
        }
        return triggerActions[0];
    }
    createOne(triggerAction, returning) {
        return this.table.insert(triggerAction, returning)
            .then(triggerActions => {
            if (!returning || returning.length === 0) {
                return {};
            }
            return triggerActions[0];
        })
            .catch(this._handleError);
    }
    updateOne(triggerActionId, update, returning) {
        return this.table.where({ triggerActionId })
            .update(update, returning)
            .then(triggerActions => {
            if (!returning || returning.length === 0) {
                return triggerActions === 0 ? null : {};
            }
            return triggerActions.length === 0 ? null : triggerActions[0];
        })
            .catch(this._handleError);
    }
    deleteOne(triggerActionId, returning) {
        return this.table.where({ triggerActionId }).delete(returning)
            .then(triggerActions => {
            if (!returning || returning.length === 0) {
                return triggerActions === 0 ? null : {};
            }
            return triggerActions.length === 0 ? null : triggerActions[0];
        })
            .catch(this._handleError);
    }
};
TriggerActionsModel = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(db_connection_class_1.DbConnection)),
    tslib_1.__param(1, inversify_1.inject(trigger_devices_model_1.TriggerDevicesModel)),
    tslib_1.__param(2, inversify_1.inject(action_devices_model_1.ActionDevicesModel)),
    tslib_1.__metadata("design:paramtypes", [db_connection_class_1.DbConnection,
        trigger_devices_model_1.TriggerDevicesModel,
        action_devices_model_1.ActionDevicesModel])
], TriggerActionsModel);
exports.TriggerActionsModel = TriggerActionsModel;
//# sourceMappingURL=trigger-actions.model.js.map