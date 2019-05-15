import { IBill } from '../../models/bills.model';
import { getIdColumn, TableName } from '../db-orchestrator';
import { DeepPartial, DeepReadonly } from '../../@types';

export function getAllBillPropertyNames(): (keyof IBill)[] {
  return [
    getIdColumn(TableName.BILLS) as 'billId',
    'startedAt', 'triggerDeviceId', 'finishedAt', 'sum',
  ];
}

// export function mergeBillRatesSortedByBillIdIntoBills<
//   R extends DeepPartial<IBillRateFromDB> & { billId: number } =
//     DeepPartial<IBillRateFromDB> & { billId: number },
//   B extends Partial<IBill<R>> & { billId: number } =
//     Partial<IBill<R>> & { billId: number }
// >(
//   bills: ReadonlyArray<B>,
//   billRates: ReadonlyArray<R>,
//   deleteBillRateBillId: true,
// ): ReadonlyArray<B & { billRates: Exclude<R, { billId: number }>[] }> {
//   const map = clusterSortedBillRatesByBillId(billRates);
//   for (const bill of bills) {
//     bill.billRates = map.get(bill.billId)!;
//   }
//   return bills as any;
// }

// function clusterSortedBillRatesByBillId<
//   R extends DeepPartial<IBillRate> & { billId: number } =
//     DeepPartial<IBillRate> & { billId: number }
// >(billRates: ReadonlyArray<R>): Map<number, R[]> {
//   const map = new Map<number, R[]>();
//   let list: R[] = undefined as unknown as R[];
//   let id = -1;
//   for (const billRate of billRates) {
//     if (billRate.billId !== id) {
//       if (id > 0) {
//         map.set(id, list);
//       }
//       id = billRate.billId;
//       list = [billRate];
//     } else {
//       list.push(billRate);
//     }
//     delete billRate.billId;
//   }
//   return map;
// }
