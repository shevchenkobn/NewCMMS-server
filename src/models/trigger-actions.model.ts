import { inject, injectable } from 'inversify';
import { PostgresError } from 'pg-error-enum';
import { DeepPartial, DeepReadonly, Nullable } from '../@types';
import { DbConnection } from '../services/db-connection.class';
import { ErrorCode, LogicError } from '../services/error.service';
import { getIdColumn, TableName } from '../utils/db-orchestrator';
import { applySortingToQuery, ComparatorFilters } from '../utils/model';
import {
  getAllTriggerActionPropertyNames,
  mergeTriggerDevicesIntoTriggerActions,
} from '../utils/models/trigger-actions';
import { ActionDevicesModel, IActionDevice } from './action-devices.model';
import { ITriggerDevice, TriggerDevicesModel } from './trigger-devices.model';

export interface ITriggerActionChange {
  actionDeviceId: number;
  triggerDeviceId: number;
}

export interface ITriggerAction extends ITriggerActionChange {
  triggerActionId: number;
}

export interface ITriggerActionWithTriggerDevice<
  T extends DeepPartial<ITriggerAction> = DeepPartial<ITriggerAction>
> extends ITriggerAction {
  triggerDevice: T;
}

export interface ITriggerActionWithActionDevice<
  T extends DeepPartial<IActionDevice> = DeepPartial<IActionDevice>
> extends ITriggerAction {
  actionDevice: T;
}

export interface ITriggerActionWithDevices<
  T extends DeepPartial<ITriggerAction> = DeepPartial<ITriggerAction>,
  A extends DeepPartial<IActionDevice> = DeepPartial<IActionDevice>
> extends ITriggerActionWithActionDevice<A>, ITriggerActionWithTriggerDevice<T> {}

export interface ITriggerActionsSelectParams {
  select?: ReadonlyArray<keyof ITriggerAction>;
  triggerActionIds?: ReadonlyArray<number>;
  comparatorFilters?: DeepReadonly<ComparatorFilters<ITriggerAction>>;
  orderBy?: ReadonlyArray<string>;
  offset?: number;
  limit?: number;
}

@injectable()
export class TriggerActionsModel {
  private _dbConnection: DbConnection;
  private _handleError: (err: any) => never;
  private _triggerDevicesModel: TriggerDevicesModel;
  private _actionDevicesModel: ActionDevicesModel;

  get table() {
    return this._dbConnection.knex(TableName.TRIGGER_ACTIONS);
  }

  constructor(
    @inject(DbConnection) dbConnection: DbConnection,
    @inject(TriggerDevicesModel) triggerDevicesModel: TriggerDevicesModel,
    @inject(ActionDevicesModel) actionDevicesModel: ActionDevicesModel,
  ) {
    this._dbConnection = dbConnection;
    this._triggerDevicesModel = triggerDevicesModel;
    this._actionDevicesModel = actionDevicesModel;
    switch (this._dbConnection.config.client) {
      case 'pg':
        this._handleError = err => {
          switch (err.code) {
            case PostgresError.FOREIGN_KEY_VIOLATION:
              const detailLower = err.detail.toLowerCase();
              if (detailLower.includes('triggerdeviceid')) {
                throw new LogicError(
                  ErrorCode.TRIGGER_ACTION_BAD_TRIGGER_DEVICE_ID,
                );
              }
              if (detailLower.includes('actiondeviceid')) {
                throw new LogicError(
                  ErrorCode.TRIGGER_ACTION_BAD_ACTION_DEVICE_ID,
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

  async getList<
    T extends DeepPartial<ITriggerAction> = ITriggerAction
  >(params: ITriggerActionsSelectParams): Promise<T[]> {
    const query = this.table;
    if (params.triggerActionIds && params.triggerActionIds.length > 0) {
      query.whereIn(
        getIdColumn(TableName.TRIGGER_ACTIONS),
        params.triggerActionIds.slice(),
      );
    }
    if (params.comparatorFilters && params.comparatorFilters.length > 0) {
      for (const filter of params.comparatorFilters) {
        query.where(...(filter as [string, string, any]));
      }
    }
    if (typeof params.offset === 'number') {
      query.offset(params.offset);
    }
    if (typeof params.limit === 'number') {
      query.limit(params.limit);
    }
    if (params.orderBy && params.orderBy.length > 0) {
      applySortingToQuery(query, params.orderBy);
    }
    return query.select((params.select && params.select.length > 0
      ? params.select.slice()
      : getAllTriggerActionPropertyNames()) as string[]);
  }

  getOne(triggerActionId: number): Promise<Nullable<ITriggerAction>>;
  getOne<T extends DeepPartial<ITriggerAction> = DeepPartial<ITriggerAction>>(
    triggerActionId: number,
    select: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<Nullable<T>>;
  async getOne(
    triggerActionId: number,
    select?: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<Nullable<DeepPartial<ITriggerAction>>> {
    const triggerActions = await this.table.where({ triggerActionId })
      .select(select as any);
    if (triggerActions.length === 0) {
      return null;
    }
    return triggerActions[0];
  }

  createOne(triggerAction: ITriggerActionChange): Promise<{}>;
  createOne<T extends DeepPartial<ITriggerAction> = DeepPartial<ITriggerAction>>(
    triggerAction: ITriggerActionChange,
    returning: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<T>;
  createOne(
    triggerAction: ITriggerActionChange,
    returning?: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<DeepPartial<ITriggerAction>> {
    return this.table.insert(triggerAction, returning as string[])
      .then(triggerActions => {
        if (!returning || returning.length === 0) {
          return {};
        }
        return triggerActions[0];
      })
      .catch(this._handleError) as any;
  }

  updateOne(
    triggerActionId: number,
    update: DeepReadonly<ITriggerActionChange>,
  ): Promise<Nullable<{}>>;
  updateOne<T extends DeepPartial<ITriggerAction> = DeepPartial<ITriggerAction>>(
    triggerActionId: number,
    update: DeepReadonly<ITriggerActionChange>,
    returning: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<Nullable<{}>>;
  updateOne(
    triggerActionId: number,
    update: DeepReadonly<ITriggerActionChange>,
    returning?: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<Nullable<DeepPartial<ITriggerAction>>> {
    return this.table.where({ triggerActionId })
      .update(update, returning as string[])
      .then(triggerActions => {
        if (!returning || returning.length === 0) {
          return triggerActions === 0 ? null : {};
        }
        return triggerActions.length === 0 ? null : triggerActions[0];
      }) as any;
  }

  deleteOne(triggerActionId: number): Promise<Nullable<{}>>;
  deleteOne<T extends DeepPartial<ITriggerAction> = DeepPartial<ITriggerAction>>(
    triggerActionId: number,
    returning: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<Nullable<T>>;
  deleteOne(
    triggerActionId: number,
    returning?: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<Nullable<DeepPartial<ITriggerAction>>> {
    return this.table.where({ triggerActionId }).delete(returning as string[])
      .then(triggerActions => {
        if (!returning || returning.length === 0) {
          return triggerActions === 0 ? null : {};
        }
        return triggerActions.length === 0 ? null : triggerActions[0];
      })
      .catch(this._handleError) as any;
  }
}
