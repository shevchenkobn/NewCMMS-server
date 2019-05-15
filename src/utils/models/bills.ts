import { IBill, IBillRate } from '../../models/bills.model';
import { getIdColumn, TableName } from '../db-orchestrator';
import { DeepPartial, DeepReadonly } from '../../@types';

export function getNonObjectBillPropertyNames(): (Exclude<keyof IBill, 'billRates'>)[] {
  return [
    getIdColumn(TableName.BILLS) as 'billId',
    'startedAt', 'triggerDeviceId', 'finishedAt', 'sum',
  ];
}

export function mergeBillRatesSortedByBillIdIntoBills<
  B extends DeepPartial<IBill> & { billId: number } =
    DeepPartial<IBill> & { billId: number },
  R extends DeepPartial<IBillRate> & { billId: number } =
    DeepPartial<IBillRate> & { billId: number }
>(
  bills: B[],
  billRates: ReadonlyArray<DeepReadonly<R>>,
  deleteBillRateBillId?: false,
): Promise<(B & { billRates: R[] })[]>;
export function mergeBillRatesSortedByBillIdIntoBills<
  B extends DeepPartial<IBill> & { billId: number } =
      DeepPartial<IBill> & { billId: number },
  R extends DeepPartial<IBillRate> & { billId: number } =
      DeepPartial<IBillRate> & { billId: number }
>(
  bills: B[],
  billRates: ReadonlyArray<R>,
  deleteBillRateBillId: true,
): Promise<(B & { billRates: Exclude<R, { billId: number }>[] })[]>;
export function mergeBillRatesSortedByBillIdIntoBills<
  B extends DeepPartial<IBill> & { billId: number } =
      DeepPartial<IBill> & { billId: number },
  R extends DeepPartial<IBillRate> & { billId: number } =
      DeepPartial<IBillRate> & { billId: number }
>(
  bills: B[],
  billRates: ReadonlyArray<R>,
  deleteBillRateBillId?: boolean,
): Promise<(B & { billRates: R[] })[]> {
  const map = new Map<number, ReadonlyArray<R>>();
}
