import { DeepPartial, Nullable } from '../@types';

export interface IBillRate {
  billId: number;
  actionDeviceId: Nullable<number>;
  hourlyRate: string;
}

export interface IBillChange {
  triggerDeviceId: Nullable<number>;
  startedAt: Date;
  finishedAt: Nullable<Date>;
  sum: Nullable<string>;
}

export interface IBill<T extends DeepPartial<IBillRate> = IBillRate> extends IBillChange {
  billId: number;
  billRates: T[];
}

export class BillsModel {

}
