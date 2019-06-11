import { inject, injectable } from 'inversify';
import { PostgresError } from 'pg-error-enum';
import { DeepPartial, DeepReadonly, Nullable } from '../@types';
import { DbConnection } from '../services/db-connection.class';
import { ErrorCode, LogicError } from '../services/error.service';
import { getIdColumn, TableName } from '../utils/db-orchestrator';
import { applySortingToQuery, ComparatorFilters } from '../utils/model';
import {
  ActionDeviceStatus,
  getAllActionDevicePropertyNames,
} from '../utils/models/action-devices';

export interface IActionDeviceChange {
  physicalAddress: string;
  status: ActionDeviceStatus;
  name: string;
  type: string;
  hourlyRate: string;
}

export interface IActionDevice extends IActionDeviceChange {
  actionDeviceId: number;
}

export interface IActionDevicesSelectParams {
  select?: ReadonlyArray<keyof IActionDevice>;
  actionDeviceIds?: ReadonlyArray<number>;
  statuses?: ReadonlyArray<ActionDeviceStatus>;
  comparatorFilters?: DeepReadonly<ComparatorFilters<IActionDevice>>;
  orderBy?: ReadonlyArray<string>;
  offset?: number;
  limit?: number;
}

@injectable()
export class ActionDevicesModel {
  private _dbConnection: DbConnection;
  private _handleError: (err: any) => never;

  get table() {
    return this._dbConnection.knex(TableName.ACTION_DEVICES);
  }

  constructor(@inject(DbConnection) dbConnection: DbConnection) {
    this._dbConnection = dbConnection;
    switch (this._dbConnection.config.client) {
      case 'pg':
        this._handleError = err => {
          switch (err.code) {
            case PostgresError.UNIQUE_VIOLATION:
              const detailLower = err.detail.toLowerCase();
              if (detailLower.includes('name')) {
                throw new LogicError(ErrorCode.ACTION_DEVICE_NAME_DUPLICATE);
              }
              if (detailLower.includes('physicaladdress')) {
                throw new LogicError(ErrorCode.ACTION_DEVICE_MAC_DUPLICATE);
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

  getList<T extends DeepPartial<IActionDevice> = IActionDevice>(
    params: IActionDevicesSelectParams,
  ): Promise<T[]> {
    const query = this.table;
    if (params.actionDeviceIds && params.actionDeviceIds.length > 0) {
      query.whereIn(
        getIdColumn(TableName.ACTION_DEVICES),
        params.actionDeviceIds.slice(),
      );
    }
    if (params.statuses && params.statuses.length > 0) {
      query.whereIn(
        'status',
        params.statuses.slice(),
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
      : getAllActionDevicePropertyNames()) as string[]) as any as Promise<T[]>;
  }

  getOne(actionDeviceId: number): Promise<Nullable<IActionDevice>>;
  getOne<T extends DeepPartial<IActionDevice> = DeepPartial<IActionDevice>>(
    actionDeviceId: number,
    select: ReadonlyArray<keyof IActionDevice>,
  ): Promise<Nullable<T>>;
  async getOne(
    actionDeviceId: number,
    select?: ReadonlyArray<keyof IActionDevice>,
  ): Promise<Nullable<IActionDevice>> {
    const devices = await this.table.where({ actionDeviceId })
      .select(select as any);
    if (devices.length === 0) {
      return null;
    }
    return devices[0];
  }

  createOne(actionDevice: IActionDeviceChange): Promise<{}>;
  createOne<T extends DeepPartial<IActionDevice> = DeepPartial<IActionDevice>>(
    actionDevice: IActionDeviceChange,
    returning: ReadonlyArray<keyof IActionDevice>,
  ): Promise<T>;
  createOne(
    actionDevice: IActionDeviceChange,
    returning?: ReadonlyArray<keyof IActionDevice>,
  ): Promise<DeepPartial<IActionDevice>> {
    return this.table.insert(actionDevice, returning as string[])
      .then(devices => {
        if (!returning || returning.length === 0) {
          return {};
        }
        return devices[0];
      })
      .catch(this._handleError) as any;
  }

  updateOne(
    actionDeviceId: number,
    update: DeepPartial<DeepReadonly<IActionDeviceChange>>,
  ): Promise<Nullable<{}>>;
  updateOne<T extends DeepPartial<IActionDevice> = DeepPartial<IActionDevice>>(
    actionDeviceId: number,
    update: DeepPartial<DeepReadonly<IActionDeviceChange>>,
    returning: ReadonlyArray<keyof IActionDevice>,
  ): Promise<Nullable<T>>;
  updateOne(
    actionDeviceId: number,
    update: DeepPartial<DeepReadonly<IActionDeviceChange>>,
    returning?: ReadonlyArray<keyof IActionDevice>,
  ): Promise<Nullable<DeepPartial<IActionDevice>>> {
    return this.table.where({ actionDeviceId })
      .update(update, returning as string[])
      .then(devices => {
        if (!returning || returning.length === 0) {
          return devices === 0 ? null : {};
        }
        return devices.length === 0 ? null : devices[0];
      })
      .catch(this._handleError) as any;
  }

  deleteOne(actionDeviceId: number): Promise<Nullable<{}>>;
  deleteOne<T extends DeepPartial<IActionDevice> = DeepPartial<IActionDevice>>(
    actionDeviceId: number,
    returning: ReadonlyArray<keyof IActionDevice>,
  ): Promise<Nullable<T>>;
  deleteOne(
    actionDeviceId: number,
    returning?: ReadonlyArray<keyof IActionDevice>,
  ): Promise<Nullable<DeepPartial<IActionDevice>>> {
    return this.table.where({ actionDeviceId }).delete(returning as string[])
      .then(devices => {
        if (!returning || returning.length === 0) {
          return devices === 0 ? null : {};
        }
        return devices.length === 0 ? null : devices[0];
      })
      .catch(this._handleError) as any;
  }
}
