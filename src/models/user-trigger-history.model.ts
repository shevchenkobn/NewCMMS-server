import { inject, injectable } from 'inversify';
import { PostgresError } from 'pg-error-enum';
import { Nullable } from '../@types';
import { DbConnection } from '../services/db-connection.class';
import { ErrorCode, LogicError } from '../services/error.service';
import { getIdColumn, TableName } from '../utils/db-orchestrator';
import {
  getAllUserTriggerPropertyNames,
  UserTriggerType,
} from '../utils/models/user-trigger-history';

export interface IUserTriggerChange {
  userId: number;
  triggerDeviceId: number;
  triggerType: UserTriggerType;
  triggerTime: Date;
}

export interface IUserTrigger extends IUserTriggerChange {
  userTriggerId: number;
}

export interface IUserTriggersSelectParams {
  userIds: ReadonlyArray<number>;
}

@injectable()
export class UserTriggerHistoryModel {
  private _dbConnection: DbConnection;
  private _handleError: (err: any) => never;

  get table() {
    return this._dbConnection.knex(TableName.USER_TRIGGER_HISTORY);
  }

  constructor(@inject(DbConnection) dbConnection: DbConnection) {
    this._dbConnection = dbConnection;
    switch (this._dbConnection.config.client) {
      case 'pg':
        this._handleError = err => {
          switch (err.code) {
            case PostgresError.FOREIGN_KEY_VIOLATION:
              const detailLower = err.detail.toLowerCase();
              if (detailLower.includes('userid')) {
                throw new LogicError(
                  ErrorCode.USER_TRIGGER_HISTORY_USER_ID_BAD,
                );
              }
              if (detailLower.includes('triggerdeviceid')) {
                throw new LogicError(
                  ErrorCode.USER_TRIGGER_HISTORY_TRIGGER_DEVICE_ID_BAD,
                );
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

  getList(params?: IUserTriggersSelectParams): Promise<IUserTrigger[]> {
    const args = Object.assign({}, params);
    const query = this.table;
    if (args.userIds && args.userIds.length > 0) {
      query.whereIn(getIdColumn(TableName.USERS), args.userIds.slice());
    }
    return query as any;
  }

  getOne(
    userTriggerId: number,
    userId?: number,
  ): Promise<Nullable<IUserTrigger>> {
    const whereClause = { userTriggerId } as Record<string, any>;
    if (typeof userId === 'number') {
      whereClause.userId = userId;
    }
    return this.table.where(whereClause)
      .then(
        userTriggers => userTriggers.length === 0 ? null : userTriggers[0],
      )
      .catch(this._handleError) as any;
  }

  deleteOne(
    userTriggerId: number,
    userId?: number,
  ): Promise<Nullable<IUserTrigger>> {
    const whereClause = { userTriggerId } as Record<string, any>;
    if (typeof userId === 'number') {
      whereClause.userId = userId;
    }
    return this.table.where(whereClause)
      .delete(getAllUserTriggerPropertyNames())
      .then(
        userTriggers => userTriggers.length === 0 ? null : userTriggers[0],
      )
      .catch(this._handleError) as any;
  }
}
