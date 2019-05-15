import { inject, injectable } from 'inversify';
import { Nullable } from '../../@types';
import { BillRatesModel, IBillRate } from '../../models/bill-rates.model';
import { BillsModel } from '../../models/bills.model';
import { ErrorCode, LogicError } from '../../services/error.service';

export interface IBillRatesList {
  billRates: IBillRate[];
  cursor: Nullable<string>;
}

@injectable()
export class BillRatesCommon {
  readonly billRatesModel: BillRatesModel;
  readonly billsModel: BillsModel;

  constructor(
    @inject(BillRatesModel) billRatesModel: BillRatesModel,
    @inject(BillsModel) billsModel: BillsModel,
  ) {
    this.billRatesModel = billRatesModel;
    this.billsModel = billsModel;
  }

  async getBillRatesForBill(billId: number): Promise<IBillRatesList> {
    if (!await this.billsModel.getOne(billId)) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return {
      billRates: await this.billRatesModel.getList({
        billIds: [billId],
      }),
      cursor: null,
    };
  }
}
