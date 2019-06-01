"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_orchestrator_1 = require("../db-orchestrator");
function getAllBillPropertyNames() {
    return [
        db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.BILLS),
        'startedAt', 'triggerDeviceId', 'finishedAt', 'sum',
    ];
}
exports.getAllBillPropertyNames = getAllBillPropertyNames;
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
//# sourceMappingURL=bills.js.map