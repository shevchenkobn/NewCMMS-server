// NOTE: Make sure to import it in every entry point you have
import { decorate, injectable } from 'inversify';
import 'reflect-metadata';

export const ASYNC_INIT = Symbol.for('@asyncInit');

export const TYPES = {
  DbConnection: Symbol.for('DbConnection'),
  DbOrchestrator: Symbol.for('DbOrchestrator'),

  AuthService: Symbol.for('AuthService'),

  UsersModel: Symbol.for('UsersModel'),
  TriggerDevicesModel: Symbol.for('TriggerDevicesModel'),
  ActionDevicesModel: Symbol.for('ActionDevicesModel'),
  TriggerActionsModel: Symbol.for('TriggerActionsModel'),
  BillsModel: Symbol.for('BillsModel'),
  BillRatesModel: Symbol.for('BillRates'),

  AuthCommon: Symbol.for('AuthCommon'),
  UsersCommon: Symbol.for('UsersCommon'),
  TriggerDevicesCommon: Symbol.for('TriggerDevicesCommon'),
  ActionDevicesCommon: Symbol.for('ActionDevicesCommon'),
  TriggerActionsCommon: Symbol.for('TriggerActionsCommon'),
  BillsCommon: Symbol.for('BillsCommon'),
  BillRatesCommon: Symbol.for('BillRatesCommon'),

  IoTService: Symbol.for('IoTService'),
};

const injectables = new Set<any>();
export function ensureInjectable(type: any) {
  if (injectables.has(type)) {
    return;
  }
  decorate(injectable(), type);
  injectables.add(type);
}
