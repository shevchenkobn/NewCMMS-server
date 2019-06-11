import {EventEmitter} from 'events';
import {inject, injectable} from 'inversify';
import {iterate} from 'iterare';
import {oc} from 'ts-optchain';
import {ensureInjectable} from '../di/types';
import {ActionDevicesModel} from '../models/action-devices.model';
import {BillRatesModel} from '../models/bill-rates.model';
import {BillsModel, IBill} from '../models/bills.model';
import {TriggerActionsModel} from '../models/trigger-actions.model';
import {TriggerDevicesModel} from '../models/trigger-devices.model';
import {IUserTrigger, UserTriggerHistoryModel,} from '../models/user-trigger-history.model';
import {AuthService} from '../services/auth.service';
import {DbConnection} from '../services/db-connection.class';
import {ErrorCode, LogicError} from '../services/error.service';
import {isPhysicalAddress} from '../utils/common';
import {ActionDeviceStatus} from '../utils/models/action-devices';
import {TriggerDeviceStatus} from '../utils/models/trigger-devices';
import {UserTriggerType} from '../utils/models/user-trigger-history';
import {JwtBearerScope} from '../utils/openapi';

export enum ActionDeviceAction {
  TOGGLE = 0,
  TURN_ON = 1,
  TURN_OFF = 2,
}

export enum ProcessTriggerResults {
  TRIGGER_DEVICE_DISCONNECTED = 0,
  ENTER_ADDED_WITHOUT_ACTIONS_TOGGLED = 1,
  LEAVE_ADDED_WITHOUT_ACTIONS_TOGGLED = 2,
  ACTIONS_TOGGLED = 4,
  ENTER_ADDED = ProcessTriggerResults.ENTER_ADDED_WITHOUT_ACTIONS_TOGGLED
    | ProcessTriggerResults.ACTIONS_TOGGLED,
  LEAVE_ADDED = ProcessTriggerResults.LEAVE_ADDED_WITHOUT_ACTIONS_TOGGLED
    | ProcessTriggerResults.ACTIONS_TOGGLED,
}

ensureInjectable(EventEmitter);
@injectable()
export class IoTService extends EventEmitter {
  readonly authService: AuthService;
  readonly dbConnection: DbConnection;
  readonly triggerDevicesModel: TriggerDevicesModel;
  readonly actionDevicesModel: ActionDevicesModel;
  readonly triggerActionsModel: TriggerActionsModel;
  readonly billsModel: BillsModel;
  readonly billRatesModel: BillRatesModel;
  readonly userTriggerHistoryModel: UserTriggerHistoryModel;

  constructor(
    @inject(AuthService) authService: AuthService,
    @inject(DbConnection) dbConnection: DbConnection,
    @inject(TriggerDevicesModel) triggerDevicesModel: TriggerDevicesModel,
    @inject(ActionDevicesModel) actionDevicesModel: ActionDevicesModel,
    @inject(TriggerActionsModel) triggerActionsModel: TriggerActionsModel,
    @inject(BillsModel) billsModel: BillsModel,
    @inject(BillRatesModel) billRatesModel: BillRatesModel,
    @inject(
      UserTriggerHistoryModel,
    ) userTriggerHistoryModel: UserTriggerHistoryModel,
  ) {
    super();
    this.authService = authService;
    this.dbConnection = dbConnection;
    this.triggerDevicesModel = triggerDevicesModel;
    this.actionDevicesModel = actionDevicesModel;
    this.triggerActionsModel = triggerActionsModel;
    this.billsModel = billsModel;
    this.billRatesModel = billRatesModel;
    this.userTriggerHistoryModel = userTriggerHistoryModel;
  }

  async processTrigger(
    triggerDeviceMac: string,
    userToken: string,
    userTriggerType = UserTriggerType.UNSPECIFIED,
  ): Promise<ProcessTriggerResults> {
    // Validate MAC and get the device
    if (!isPhysicalAddress(triggerDeviceMac)) {
      throw new LogicError(ErrorCode.MAC_INVALID);
    }
    const triggerDevice = await this.triggerDevicesModel.getOne(
      { physicalAddress: triggerDeviceMac },
    );
    if (!triggerDevice) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    if (triggerDevice.status === TriggerDeviceStatus.DISCONNECTED) {
      return ProcessTriggerResults.TRIGGER_DEVICE_DISCONNECTED;
    }

    const user = await this.authService.getUserFromAccessToken(
      userToken,
      [JwtBearerScope.EMPLOYEE],
    );
    const dateTriggered = new Date();

    const userTriggers = await this.userTriggerHistoryModel
      .getListForLastBill<IUserTrigger>(
        triggerDevice.triggerDeviceId,
      );
    let billRates;
    let triggerType: UserTriggerType;
    if (userTriggers.length === 0) { // no opened bills
      triggerType = userTriggerType !== UserTriggerType.UNSPECIFIED
        ? userTriggerType
        : UserTriggerType.ENTER;
      // Create bill and first user trigger
      await this.dbConnection.knex.transaction(trx => {
        Promise.join(
          this.userTriggerHistoryModel.createOne({
            triggerType,
            userId: user.userId,
            triggerTime: dateTriggered,
            triggerDeviceId: triggerDevice.triggerDeviceId,
          }, trx),
          this.billsModel.createOneWithBillRates({
            triggerDeviceId: triggerDevice.triggerDeviceId,
            startedAt: dateTriggered,
            finishedAt: null,
            sum: '0',
          }, trx),
        ).then(trx.commit).catch(trx.rollback);
      });
    } else {
      const groupedTriggers = groupUserTriggersByUserIdAndType(userTriggers);
      triggerType = userTriggerType !== UserTriggerType.UNSPECIFIED
        ? userTriggerType
        : (
          isEnterTrigger(groupedTriggers, user.userId)
            ? UserTriggerType.ENTER
            : UserTriggerType.LEAVE
        );
      switch (triggerType) {
        case UserTriggerType.ENTER: {
          // Just add trigger to db
          await this.userTriggerHistoryModel.createOne({
            triggerType,
            userId: user.userId,
            triggerTime: dateTriggered,
            triggerDeviceId: triggerDevice.triggerDeviceId,
          });
        }
          break;
        case UserTriggerType.LEAVE: {
          // Check if everyone has exited. If true update the bill
          if (haveAllExceptOneExited(groupedTriggers)) {
            const results = await Promise.all([
              this.billRatesModel.getListForTriggerDevice(
                triggerDeviceMac,
              ),
              this.billsModel.getLastForTriggerDevice<IBill>(
                triggerDevice.triggerDeviceId,
              ),
            ]);
            billRates = results[0];
            const bill = results[1];
            if (!bill) {
              throw new TypeError('Unexpected absent bill');
            }
            const sum = await this.billRatesModel.getBillSumForTriggerDevice(
              triggerDeviceMac,
              bill.startedAt,
              dateTriggered,
            );
            await this.dbConnection.knex.transaction(trx => {
              Promise.join(
                this.billsModel.updateOne(bill.billId, {
                  sum,
                  finishedAt: dateTriggered,
                }),
                this.userTriggerHistoryModel.createOne({
                  triggerType,
                  userId: user.userId,
                  triggerTime: dateTriggered,
                  triggerDeviceId: triggerDevice.triggerDeviceId,
                }, trx),
              ).then(trx.commit).then(trx.rollback);
            });
          } else {
            await this.userTriggerHistoryModel.createOne({
              triggerType,
              userId: user.userId,
              triggerTime: dateTriggered,
              triggerDeviceId: triggerDevice.triggerDeviceId,
            });
          }
        }
          break;
      }
    }
    if (!billRates) {
      billRates = await this.billRatesModel.getListForTriggerDevice(
        triggerDeviceMac,
      );
    }
    if (billRates.length === 0) {
      return triggerType === UserTriggerType.ENTER
        ? ProcessTriggerResults.ENTER_ADDED_WITHOUT_ACTIONS_TOGGLED
        : ProcessTriggerResults.LEAVE_ADDED_WITHOUT_ACTIONS_TOGGLED;
    }
    // Do the actions
    const actionDevices = await this.actionDevicesModel.getList({
      actionDeviceIds: iterate(billRates)
        .filter(rate => typeof rate.actionDeviceId === 'number')
        .map(rate => rate.actionDeviceId as number).toArray(),
      statuses: [ActionDeviceStatus.CONNECTED, ActionDeviceStatus.ONLINE],
    });
    const promises = [];
    for (const device of actionDevices) {
      // FIXME: choose action according to status
      promises.push(this.actionDevicesModel.updateOne(
        device.actionDeviceId,
        {
          status: device.status === ActionDeviceStatus.CONNECTED
            ? ActionDeviceStatus.ONLINE
            : ActionDeviceStatus.CONNECTED,
        },
      ));
      this.emit(
        'action-device/toggle',
        device,
        ActionDeviceAction.TOGGLE,
      );
    }
    await Promise.all(promises);
    return triggerType === UserTriggerType.ENTER
      ? ProcessTriggerResults.ENTER_ADDED
      : ProcessTriggerResults.LEAVE_ADDED;
  }
}

function haveAllExceptOneExited(
  map: ReadonlyMap<number, ReadonlyMap<UserTriggerType, IUserTrigger[]>>,
) {
  let foundOnePresent = false;
  for (const triggers of map.values()) {
    if (!(
      (
        !triggers.has(UserTriggerType.ENTER)
        && !triggers.has(UserTriggerType.LEAVE)
      )
      || (
        triggers.has(UserTriggerType.ENTER)
        && triggers.has(UserTriggerType.LEAVE)
        && triggers.get(UserTriggerType.ENTER)!.length ===
          triggers.get(UserTriggerType.LEAVE)!.length
      )
    )) {
      if (foundOnePresent) {
        return false;
      }
      foundOnePresent = true;
    }
  }
  return true;
}

function isEnterTrigger(
  map: ReadonlyMap<number, ReadonlyMap<UserTriggerType, IUserTrigger[]>>,
  userId: number,
) {
  return !map.has(userId) || hasUserLeft(map.get(userId)!);
}

function groupUserTriggersByUserIdAndType(
  userTriggers: ReadonlyArray<IUserTrigger>,
): Map<number, Map<UserTriggerType, IUserTrigger[]>> {
  const map = new Map<number, Map<UserTriggerType, IUserTrigger[]>>();
  for (const trigger of userTriggers) {
    if (map.has(trigger.userId)) {
      const nestedMap = map.get(trigger.userId)!;
      if (nestedMap.has(trigger.triggerType)) {
        nestedMap.get(trigger.triggerType)!.push(trigger);
      } else {
        nestedMap.set(trigger.triggerType, [trigger]);
      }
    } else {
      map.set(trigger.userId, new Map([
        [trigger.triggerType, [trigger]],
      ]));
    }
  }
  return map;
}

function hasUserLeft(map: ReadonlyMap<UserTriggerType, IUserTrigger[]>) {
  const enteredCount = oc(map.get(UserTriggerType.ENTER)).length || 0;
  const leftCount = oc(map.get(UserTriggerType.LEAVE)).length || 0;
  if (enteredCount === leftCount) {
    return true;
  }
  if (enteredCount === leftCount + 1) {
    return false;
  }
  throw new TypeError(`Unexpected count: enteredCount = ${enteredCount}; leftCount = ${leftCount}`);
}
