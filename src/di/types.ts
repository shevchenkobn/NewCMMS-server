// NOTE: Make sure to import it in every entry point you have
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

  AuthCommon: Symbol.for('AuthCommon'),
  UsersCommon: Symbol.for('UsersCommon'),
  TriggerDevicesCommon: Symbol.for('TriggerDevicesCommon'),
  ActionDevicesCommon: Symbol.for('ActionDevicesCommon'),
  TriggerActionsCommon: Symbol.for('TriggerActionsCommon'),
};
