import { IBillRate, IBillRateFromDB } from '../../models/bill-rates.model';

export function getAllSafeBillRatePropertyNames(): (keyof IBillRate)[] {
  return ['actionDeviceId', 'hourlyRate'];
}

export function getAllBillRateFromDbPropertyNames(): (keyof IBillRateFromDB)[] {
  return getAllSafeBillRatePropertyNames().concat('billId' as any);
}
