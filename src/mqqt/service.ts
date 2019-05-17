import { inject, injectable } from 'inversify';
import { BillsModel } from '../models/bills.model';
import { TriggerActionsModel } from '../models/trigger-actions.model';
import { BillRatesModel } from '../models/bill-rates.model';
import { AuthService } from '../services/auth.service';
import { TriggerDevicesModel } from '../models/trigger-devices.model';

@injectable()
export class IoTService {
  readonly authService: AuthService; // For token from IoT validation
  readonly triggerDevicesModel: TriggerDevicesModel;
  readonly triggerActionsModel: TriggerActionsModel;
  readonly billsModel: BillsModel; // FIXME: maybe additional service for bill update is needed
  readonly billRatesModel: BillRatesModel; // Not sure if needed for bill calculation;

  constructor(
    @inject(AuthService) authService: AuthService,
    @inject(TriggerDevicesModel) triggerDevicesModel: TriggerDevicesModel,
    @inject(TriggerActionsModel) triggerActionsModel: TriggerActionsModel,
    @inject(BillsModel) billsModel: BillsModel,
    @inject(BillRatesModel) billRatesModel: BillRatesModel,
  ) {
    this.authService = authService;
    this.triggerDevicesModel = triggerDevicesModel;
    this.triggerActionsModel = triggerActionsModel;
    this.billsModel = billsModel;
    this.billRatesModel = billRatesModel;
  }
}