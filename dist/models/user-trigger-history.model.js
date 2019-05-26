"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const pg_error_enum_1 = require("pg-error-enum");
const db_connection_class_1 = require("../services/db-connection.class");
const error_service_1 = require("../services/error.service");
const db_orchestrator_1 = require("../utils/db-orchestrator");
const user_trigger_history_1 = require("../utils/models/user-trigger-history");
let UserTriggerHistoryModel = class UserTriggerHistoryModel {
    constructor(dbConnection) {
        this._dbConnection = dbConnection;
        switch (this._dbConnection.config.client) {
            case 'pg':
                this._handleError = err => {
                    switch (err.code) {
                        case pg_error_enum_1.PostgresError.FOREIGN_KEY_VIOLATION:
                            const detailLower = err.detail.toLowerCase();
                            if (detailLower.includes('userid')) {
                                throw new error_service_1.LogicError(error_service_1.ErrorCode.USER_TRIGGER_HISTORY_USER_ID_BAD);
                            }
                            if (detailLower.includes('triggerdeviceid')) {
                                throw new error_service_1.LogicError(error_service_1.ErrorCode.USER_TRIGGER_HISTORY_TRIGGER_DEVICE_ID_BAD);
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
        return this._dbConnection.knex(db_orchestrator_1.TableName.USER_TRIGGER_HISTORY);
    }
    createOne(userTrigger, transaction, returning) {
        const query = this.table.insert(userTrigger, returning);
        if (transaction) {
            query.transacting(transaction);
        }
        return query.catch(this._handleError).then(userTriggers => !returning || returning.length === 0
            ? {}
            : userTriggers[0]);
    }
    getList(params) {
        const args = Object.assign({}, params);
        const query = this.table;
        if (args.userIds && args.userIds.length > 0) {
            query.whereIn(db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.USERS), args.userIds.slice());
        }
        return query;
    }
    getListForLastBill(triggerDeviceId, select = user_trigger_history_1.getAllUserTriggerPropertyNames()) {
        const triggerDeviceIdColumn = db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.TRIGGER_DEVICES);
        const startedAt = 'startedAt';
        return this.table.where(triggerDeviceIdColumn, triggerDeviceId).where('triggerTime', '>=', this._dbConnection.knex(db_orchestrator_1.TableName.BILLS)
            .where(triggerDeviceIdColumn, triggerDeviceId)
            .where('finishedAt', null)
            .orderBy(startedAt, 'desc')
            .first(startedAt)).select(select);
    }
    getOne(userTriggerId, userId) {
        const whereClause = { userTriggerId };
        if (typeof userId === 'number') {
            whereClause.userId = userId;
        }
        return this.table.where(whereClause)
            .then(userTriggers => userTriggers.length === 0 ? null : userTriggers[0])
            .catch(this._handleError);
    }
    deleteOne(userTriggerId, userId) {
        const whereClause = { userTriggerId };
        if (typeof userId === 'number') {
            whereClause.userId = userId;
        }
        return this.table.where(whereClause)
            .delete(user_trigger_history_1.getAllUserTriggerPropertyNames())
            .then(userTriggers => userTriggers.length === 0 ? null : userTriggers[0])
            .catch(this._handleError);
    }
};
UserTriggerHistoryModel = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(db_connection_class_1.DbConnection)),
    tslib_1.__metadata("design:paramtypes", [db_connection_class_1.DbConnection])
], UserTriggerHistoryModel);
exports.UserTriggerHistoryModel = UserTriggerHistoryModel;
//# sourceMappingURL=user-trigger-history.model.js.map