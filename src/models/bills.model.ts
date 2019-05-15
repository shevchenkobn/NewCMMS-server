import { inject } from 'inversify';
import * as Knex from 'knex';
import { PostgresError } from 'pg-error-enum';
import { DeepPartial, DeepReadonly, Nullable } from '../@types';
import { DbConnection } from '../services/db-connection.class';
import { ErrorCode, LogicError } from '../services/error.service';
import { getIdColumn, TableName } from '../utils/db-orchestrator';
import { applySortingToQuery, ComparatorFilters } from '../utils/model';
import { getAllBillPropertyNames } from '../utils/models/bills';
import { ActionDevicesModel } from './action-devices.model';
import { BillRatesModel } from './bill-rates.model';

export interface IBillChange {
  triggerDeviceId: Nullable<number>;
  startedAt: Date;
  finishedAt: Nullable<Date>;
  sum: Nullable<string>;
}

export interface IBill extends IBillChange {
  billId: number;
}

export interface IBillsSelectParams {
  select?: ReadonlyArray<keyof IBill>;
  billIds?: ReadonlyArray<number>;
  comparatorFilters: DeepReadonly<ComparatorFilters<IBill>>;
  orderBy?: ReadonlyArray<string>;
  offset?: number;
  limit?: number;
}

export class BillsModel {
  private _dbConnection: DbConnection;
  private _billRatesModel: BillRatesModel;
  private _actionDevicesModel: ActionDevicesModel;
  private _handleError: (err: any) => never;
  private _transaction: Nullable<Knex.Transaction>;

  get table() {
    return this._dbConnection.knex(TableName.BILLS);
  }

  constructor(
    @inject(DbConnection) dbConnection: DbConnection,
    @inject(BillRatesModel) billRatesModel: BillRatesModel,
    @inject(ActionDevicesModel) actionDevicesModel: ActionDevicesModel,
  ) {
    this._dbConnection = dbConnection;
    this._billRatesModel = billRatesModel;
    this._actionDevicesModel = actionDevicesModel;
    this._transaction = null;
    switch (this._dbConnection.config.client) {
      case 'pg':
        this._handleError = err => {
          switch (err.code) {
            case PostgresError.FOREIGN_KEY_VIOLATION:
              const detailLower = err.detail.toLowerCase();
              if (detailLower.includes('triggerdeviceid')) {
                throw new LogicError(
                  ErrorCode.BILL_BAD_TRIGGER_DEVICE_ID,
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

  getList<
    T extends DeepPartial<IBill> = IBill
  >(params: IBillsSelectParams): Promise<T[]> {
    const query = this.table;
    if (params.billIds && params.billIds.length > 0) {
      query.whereIn(
        getIdColumn(TableName.BILLS),
        params.billIds.slice(),
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
      : getAllBillPropertyNames()) as string[]) as any;
  }

  createOneWithBillRates(bill: IBillChange): Promise<{}>;
  createOneWithBillRates<T extends DeepPartial<IBill> = DeepPartial<IBill>>(
    bill: IBillChange,
    returning: ReadonlyArray<keyof IBill>,
  ): Promise<T>;
  async createOneWithBillRates(
    bill: IBillChange,
  ): Promise<IBill> {
    let newBill: IBill;
    const trx = this._dbConnection.knex.transaction(trx => {
      this._transaction = trx;
      this.createOne<IBill>(bill, getAllBillPropertyNames()).then(
        bill => {
          newBill = bill;
          const actionDeviceIdName = getIdColumn(TableName.ACTION_DEVICES);
          const actionDeviceIdColumn = `${TableName.ACTION_DEVICES}.${actionDeviceIdName}`;
          this._actionDevicesModel.table
            .innerJoin(
              TableName.TRIGGER_ACTIONS,
              actionDeviceIdColumn,
              `${TableName.TRIGGER_ACTIONS}.${actionDeviceIdName}`,
            )
            .innerJoin(
              TableName.TRIGGER_DEVICES,
              `${TableName.TRIGGER_ACTIONS}.${getIdColumn(TableName.TRIGGER_DEVICES)}`,
              `${TableName.TRIGGER_DEVICES}.${getIdColumn(TableName.TRIGGER_DEVICES)}`,
            )
            .select(
              `${actionDeviceIdColumn} as ${actionDeviceIdName}`,
              `${TableName.ACTION_DEVICES}.hourlyRate as hourlyRate`,
            )
            .then(actionDevices => {
              this._billRatesModel.createMany(actionDevices, this._transaction!)
                .then(billRates => {
                  this._transaction = null;
                  trx.commit(newBill);
                });
            });
        },
      );
    });
    await trx;
    return newBill!;
  }

  createOne(bill: IBillChange): Promise<{}>;
  createOne<T extends DeepPartial<IBill> = DeepPartial<IBill>>(
    bill: IBillChange,
    returning: ReadonlyArray<keyof IBill>,
  ): Promise<T>;
  createOne(
    bill: IBillChange,
    returning?: ReadonlyArray<keyof IBill>,
  ): Promise<DeepPartial<IBill>> {
    const query = this.table.insert(bill, returning as string[]);
    if (this._transaction) {
      query.transacting(this._transaction);
    }
    return query
      .then(bills => {
        if (!returning || returning.length === 0) {
          return {};
        }
        return bills[0];
      })
      .catch(this._handleError) as any;
  }

  updateOne(
    billId: number,
    update: DeepReadonly<IBillChange>,
  ): Promise<Nullable<{}>>;
  updateOne<T extends DeepPartial<IBill> = DeepPartial<IBill>>(
    billId: number,
    update: DeepReadonly<IBillChange>,
    returning: ReadonlyArray<keyof IBill>,
  ): Promise<Nullable<T>>;
  updateOne(
    billId: number,
    update: DeepReadonly<IBillChange>,
    returning?: ReadonlyArray<keyof IBill>,
  ): Promise<Nullable<DeepPartial<IBill>>> {
    return this.table.where({ billId })
      .update(update, returning as string[])
      .then(bills => {
        if (!returning || returning.length === 0) {
          return bills === 0 ? null : {};
        }
        return bills.length === 0 ? null : bills[0];
      })
      .catch(this._handleError) as any;
  }

  deleteOne(billId: number): Promise<Nullable<{}>>;
  deleteOne<T extends DeepPartial<IBill> = DeepPartial<IBill>>(
    billId: number,
    returning: ReadonlyArray<keyof IBill>,
  ): Promise<Nullable<T>>;
  deleteOne(
    billId: number,
    returning?: ReadonlyArray<keyof IBill>,
  ): Promise<Nullable<DeepPartial<IBill>>> {
    return this.table.where({ billId }).delete(returning as string[])
      .then(bills => {
        if (!returning || returning.length === 0) {
          return bills === 0 ? null : {};
        }
        return bills.length === 0 ? null : bills[0];
      })
      .catch(this._handleError) as any;
  }
}
