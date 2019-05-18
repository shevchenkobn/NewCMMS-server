import { inject, injectable } from 'inversify';
import * as Knex from 'knex';
import { PostgresError } from 'pg-error-enum';
import { DeepPartial, Nullable } from '../@types';
import { DbConnection } from '../services/db-connection.class';
import { ErrorCode, LogicError } from '../services/error.service';
import { getIdColumn, TableName } from '../utils/db-orchestrator';
import { applySortingToQuery } from '../utils/model';
import { getAllBillRateFromDbPropertyNames } from '../utils/models/bill-rate';

export interface IBillRate {
  actionDeviceId: Nullable<number>;
  hourlyRate: string;
}

export interface IBillRateFromDB extends IBillRate {
  billId: number;
}

export interface IBillRateSelectParams {
  select?: ReadonlyArray<keyof IBillRateFromDB>;
  billIds?: ReadonlyArray<number>;
  orderBy?: ReadonlyArray<string>;
  offset?: number;
  limit?: number;
}

@injectable()
export class BillRatesModel {
  private _dbConnection: DbConnection;
  private _handleError: (err: any) => never;

  get table() {
    return this._dbConnection.knex(TableName.BILL_RATES);
  }

  constructor(
    @inject(DbConnection) dbConnection: DbConnection,
  ) {
    this._dbConnection = dbConnection;
    switch (this._dbConnection.config.client) {
      case 'pg':
        this._handleError = err => {
          switch (err.code) {
            case PostgresError.FOREIGN_KEY_VIOLATION: {
              const detailLower = err.detail.toLowerCase();
              if (detailLower.includes('actiondeviceid')) {
                throw new LogicError(
                  ErrorCode.BILL_RATE_ACTION_DEVICE_ID_BAD,
                );
              }
            }
            case PostgresError.INVALID_TEXT_REPRESENTATION: {
              const detailLower = err.detail.toLowerCase();
              if (detailLower.includes('"notmac"')) {
                throw new LogicError(ErrorCode.MAC_INVALID);
              }
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
    T extends DeepPartial<IBillRate> = IBillRate,
  >(params: IBillRateSelectParams): Promise<T[]> {
    const query = this.table;
    if (params.billIds && params.billIds.length > 0) {
      query.whereIn(
        getIdColumn(TableName.BILLS),
        params.billIds.slice(),
      );
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
      : getAllBillRateFromDbPropertyNames()) as any[]) as any;
  }

  getListForTriggerDevice(triggerDeviceMac: string): Promise<IBillRate[]> {
    return this.getSelectQueryForTriggerDevice(triggerDeviceMac)
      .catch(this._handleError) as any;
  }

  getBillSumForTriggerDevice(
    triggerDeviceMac: string,
    startDate: Date,
    endDate: Date,
  ): Promise<string> {
    const hoursDiffClause = this._dbConnection.getDatesDiffInHours(
      endDate,
      startDate,
    );
    return this._dbConnection.knex()
      .select(hoursDiffClause.wrap('sum(hourlyRate) * ', ' as sum'))
      .from(this.getSelectQueryForTriggerDevice(triggerDeviceMac))
      .catch(this._handleError)
      .then(sum => sum.sum) as any;
  }

  createMany(
    billRates: ReadonlyArray<IBillRate>,
    transaction: Knex.Transaction,
  ): Promise<{}[]>;
  createMany<T extends DeepPartial<IBillRate> = DeepPartial<IBillRate>>(
    billRates: ReadonlyArray<IBillRate>,
    transaction: Knex.Transaction,
    returning: ReadonlyArray<keyof IBillRate>,
  ): Promise<T[]>;
  createMany(
    billRates: ReadonlyArray<IBillRate>,
    transaction: Knex.Transaction,
    returning?: ReadonlyArray<keyof IBillRate>,
  ): Promise<DeepPartial<IBillRate>[]> {
    return this.table.transacting(transaction)
      .insert(billRates, returning as string[])
      .then(billRates => {
        if (!returning || returning.length === 0) {
          // tslint:disable-next-line:prefer-array-literal
          return new Array(billRates).map(() => ({}));
        }
        return billRates;
      })
      .catch(this._handleError) as any;
  }

  deleteMany<T extends DeepPartial<IBillRate> = DeepPartial<IBillRate>>(
    billId: number,
    transaction: Knex.Transaction,
    returning?: ReadonlyArray<keyof IBillRate>,
  ): Promise<Nullable<T[]>> {
    return this.table.where({ billId })
      .transacting(transaction)
      .delete(returning as string[])
      .then(billRates => {
        if (!returning || returning.length === 0) {
          // tslint:disable-next-line:prefer-array-literal
          return new Array(billRates).map(() => ({}));
        }
        return billRates;
      })
      .catch(this._handleError) as any;
  }

  private getSelectQueryForTriggerDevice(triggerDeviceMac: string) {
    const actionDeviceId = getIdColumn(TableName.ACTION_DEVICES);
    const billRatesActionDeviceId = `${TableName.BILL_RATES}.${actionDeviceId}`;
    const triggerDeviceId = getIdColumn(TableName.TRIGGER_DEVICES);
    return this.table.innerJoin(
      TableName.TRIGGER_ACTIONS,
      billRatesActionDeviceId,
      `${TableName.TRIGGER_ACTIONS}.${actionDeviceId}`,
    ).innerJoin(
      TableName.TRIGGER_DEVICES,
      `${TableName.TRIGGER_ACTIONS}.${triggerDeviceId}`,
      `${TableName.TRIGGER_DEVICES}.${triggerDeviceId}`,
    ).where(
      `${TableName.TRIGGER_DEVICES}.physicalAddress`,
      triggerDeviceMac,
    ).select(
      `${billRatesActionDeviceId} as ${actionDeviceId}`,
      `${TableName.BILL_RATES}.hourlyRate as hourlyRate`,
    );
  }

}
