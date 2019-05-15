import { inject, injectable } from 'inversify';
import { Nullable } from '../../@types';
import { BillsModel, IBill } from '../../models/bills.model';
import { ErrorCode, LogicError } from '../../services/error.service';
import { getAllBillPropertyNames } from '../../utils/models/bills';

export interface IBillList {
  bills: IBill[];
  cursor: Nullable<string>;
}

@injectable()
export class BillsCommon {
  readonly billsModel: BillsModel;

  constructor(
    @inject(BillsModel) billsModel: BillsModel,
  ) {
    this.billsModel = billsModel;
  }

  async getBills(): Promise<IBillList> {
    return {
      bills: await this.billsModel.getList(),
      cursor: null,
    };
  }

  async getBill(billId: number): Promise<IBill> {
    const bill = await this.billsModel.getOne(billId);
    if (!bill) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return bill;
  }

  async deleteBill(billId: number): Promise<IBill> {
    const bill = await this.billsModel.deleteOne<IBill>(
      billId,
      getAllBillPropertyNames(),
    );
    if (!bill) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return bill;
  }
}
