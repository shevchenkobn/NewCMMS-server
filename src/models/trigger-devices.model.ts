import { inject, injectable } from 'inversify';
import { DeepPartial, DeepReadonly, Nullable } from '../@types';
import { DbConnection } from '../services/db-connection.class';
import { ErrorCode, LogicError } from '../services/error.service';
import { getIdColumn, TableName } from '../utils/db-orchestrator';
import { applySortingToQuery, ComparatorFilters } from '../utils/model';
import {
  getAllTriggerDevicePropertyNames,
  isValidTriggerDeviceUniqueIdentifier,
  TriggerDeviceStatus,
} from '../utils/models/trigger-devices';

export interface ITriggerDeviceChange {
  physicalAddress: string;
  status: TriggerDeviceStatus;
  name: string;
  type: string;
}

export interface ITriggerDevice extends ITriggerDeviceChange {
  triggerDeviceId: number;
}

export interface ITriggerDevicesSelectParams {
  select?: ReadonlyArray<keyof ITriggerDevice>;
  triggerDeviceIds?: ReadonlyArray<number>;
  comparatorFilters?: DeepReadonly<ComparatorFilters<ITriggerDevice>>;
  orderBy?: ReadonlyArray<string>;
  offset?: number;
  limit?: number;
}

export interface ITriggerDeviceId {
  triggerDeviceId: number;
}

export interface ITriggerDeviceName {
  name: string;
}

@injectable()
export class TriggerDevicesModel {
  private _dbConnection: DbConnection;
  private _handleError: (err: any) => never;

  get table() {
    return this._dbConnection.knex(TableName.TRIGGER_DEVICES);
  }

  constructor(@inject(DbConnection) dbConnection: DbConnection) {
    this._dbConnection = dbConnection;
    switch (this._dbConnection.config.client) {
      case 'pg':
        this._handleError = err => {
          switch (err.code) {
            case '23505':
              const detailLower = err.detail.toLowerCase();
              if (detailLower.includes('name')) {
                throw new LogicError(ErrorCode.TRIGGER_DEVICE_NAME_DUPLICATE);
              }
              if (detailLower.includes('physicalAddress')) {
                throw new LogicError(ErrorCode.TRIGGER_DEVICE_MAC_DUPLICATE);
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

  getList<T extends DeepPartial<ITriggerDevice> = ITriggerDevice>(
    params: ITriggerDevicesSelectParams,
  ): Promise<T[]> {
    const query = this.table;
    if (params.triggerDeviceIds && params.triggerDeviceIds.length > 0) {
      query.whereIn(
        getIdColumn(TableName.TRIGGER_DEVICES),
        params.triggerDeviceIds.slice(),
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
    return query.select(
      (params.select && params.select.length > 0
        ? params.select.slice()
        : getAllTriggerDevicePropertyNames()) as string[],
    ) as any as Promise<T[]>;
  }

  getOne(
    triggerDeviceId: DeepReadonly<ITriggerDeviceId>,
  ): Promise<Nullable<ITriggerDevice>>;
  getOne<T extends DeepPartial<ITriggerDevice> = DeepPartial<ITriggerDevice>>(
    triggerDeviceId: DeepReadonly<ITriggerDeviceId>,
    select: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<Nullable<ITriggerDevice>>;
  getOne(
    triggerDeviceName: DeepReadonly<ITriggerDeviceName>,
  ): Promise<Nullable<ITriggerDevice>>;
  getOne<T extends DeepPartial<ITriggerDevice> = DeepPartial<ITriggerDevice>>(
    triggerDeviceName: DeepReadonly<ITriggerDeviceName>,
    select: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<Nullable<ITriggerDevice>>;
  async getOne(
    nameOrTriggerDeviceId: DeepReadonly<ITriggerDeviceName | ITriggerDeviceId>,
    select = getAllTriggerDevicePropertyNames() as
      ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<Nullable<ITriggerDeviceId | DeepPartial<ITriggerDevice>>> {
    if (!isValidTriggerDeviceUniqueIdentifier(nameOrTriggerDeviceId)) {
      throw new LogicError(
        ErrorCode.TRIGGER_DEVICE_ID_AND_NAME,
        'Both id and name present. Use only one of them.',
      );
    }
    const users = await this.table.where(nameOrTriggerDeviceId)
      .select(select as any);
    if (users.length === 0) {
      return null;
    }
    return users[0];
  }

  createOne(triggerDevice: ITriggerDeviceChange): Promise<{}>;
  createOne<T extends DeepPartial<ITriggerDevice> = DeepPartial<ITriggerDevice>>(
    triggerDevice: ITriggerDeviceChange,
    returning: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<T>;
  createOne(
    triggerDevice: ITriggerDeviceChange,
    returning?: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<DeepPartial<ITriggerDevice> | {}> {
    const returnNew = returning && returning.length > 0;
    return this.table.insert(triggerDevice, returning as string[])
      .then(devices => {
        if (!returnNew) {
          return {};
        }
        return devices[0];
      })
      .catch(this._handleError) as any;
  }

  updateOne(
    triggerDeviceId: number,
    update: DeepReadonly<ITriggerDeviceChange>,
  ): Promise<Nullable<{}>>;
  updateOne<T extends DeepPartial<ITriggerDevice> = DeepPartial<ITriggerDevice>>(
    triggerDeviceId: number,
    update: DeepReadonly<ITriggerDeviceChange>,
    returning: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<Nullable<T>>;
  updateOne(
    triggerDeviceId: number,
    update: DeepPartial<ITriggerDeviceChange>,
    returning?: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<Nullable<{} | DeepPartial<ITriggerDevice>>> {
    return this.table.where({ triggerDeviceId })
      .update(update, returning as string[])
      .then(devices => {
        if (!returning || returning.length === 0) {
          return devices === 0 ? null : {};
        }
        return devices.length === 0 ? null : devices[0];
      })
      .catch(this._handleError) as any;
  }

  deleteOne(triggerDeviceId: number): Promise<Nullable<{}>>;
  deleteOne<T extends DeepPartial<ITriggerDevice> = DeepPartial<ITriggerDevice>>(
    triggerDeviceId: number,
    returning: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<Nullable<T>>;
  deleteOne(
    triggerDeviceId: number,
    returning?: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<Nullable<DeepPartial<ITriggerDevice> | {}>> {
    return this.table.where({ triggerDeviceId }).delete(returning as string[])
      .then(devices => {
        if (!returning || returning.length === 0) {
          return devices === 0 ? null : {};
        }
        return devices.length === 0 ? null : devices[0];
      }) as any;
  }
}
