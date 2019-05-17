import { ActionDevicesModel } from '../models/action-devices.model';
import { BillRatesModel } from '../models/bill-rates.model';
import { BillsModel } from '../models/bills.model';
import { TriggerActionsModel } from '../models/trigger-actions.model';
import { TriggerDevicesModel } from '../models/trigger-devices.model';
import { ActionDevicesCommon } from '../openapi/services/action-devices.common';
import { AuthCommon } from '../openapi/services/auth.common';
import { BillRatesCommon } from '../openapi/services/bill-rates.common';
import { BillsCommon } from '../openapi/services/bills.common';
import { TriggerActionsCommon } from '../openapi/services/trigger-actions.common';
import { TriggerDevicesCommon } from '../openapi/services/trigger-devices.common';
import { UsersCommon } from '../openapi/services/users.common';
import { AuthService } from '../services/auth.service';
import { ASYNC_INIT, TYPES } from './types';
import {
  BindingScopeEnum,
  Container,
  interfaces,
} from 'inversify';
import { Maybe, Nullable, Optional } from '../@types';
import { DbConnection } from '../services/db-connection.class';
import ServiceIdentifier = interfaces.ServiceIdentifier;
import { logger } from '../services/logger.service';
import { DbOrchestrator } from '../services/db-orchestrator.class';
import Newable = interfaces.Newable;
import { UsersModel } from '../models/users.model';
import { IoTService } from '../mqqt/service';

export const typeMap: ReadonlyMap<ServiceIdentifier<any>, Newable<any>> =
  new Map<ServiceIdentifier<any>, Newable<any>>([
    [TYPES.DbConnection, DbConnection],
    [TYPES.DbOrchestrator, DbOrchestrator],

    [TYPES.AuthService, AuthService],

    [TYPES.UsersModel, UsersModel],
    [TYPES.TriggerDevicesModel, TriggerDevicesModel],
    [TYPES.ActionDevicesModel, ActionDevicesModel],
    [TYPES.TriggerActionsModel, TriggerActionsModel],
    [TYPES.BillsModel, BillsModel],
    [TYPES.BillRatesModel, BillRatesModel],

    [TYPES.AuthCommon, AuthCommon],
    [TYPES.UsersCommon, UsersCommon],
    [TYPES.TriggerDevicesCommon, TriggerDevicesCommon],
    [TYPES.ActionDevicesCommon, ActionDevicesCommon],
    [TYPES.TriggerActionsCommon, TriggerActionsCommon],
    [TYPES.BillsCommon, BillsCommon],
    [TYPES.BillRatesCommon, BillRatesCommon],

    [TYPES.IoTService, IoTService],
  ]);

function bindDependency<T>(
  typeId: ServiceIdentifier<T>,
  type?: Newable<T>,
) {
  container!
    .bind<any>(typeId)
    .to(type || typeMap.get(typeId)!);
}

let container: Nullable<Container> = null;
let containedDependencies: Nullable<ServiceIdentifier<any>[]> = null;

export function getContainer() {
  if (!container) {
    throw new TypeError('Container is not instantiated');
  }
  return container;
}

export function isContainerCreated() {
  return !!container;
}

export function getContainedDependencies() {
  if (!container) {
    throw new TypeError('Container is not instantiated');
  }
  return containedDependencies!.keys();
}

export function addContainedDependencies(
  typeIds: ReadonlyArray<ServiceIdentifier<any>>,
) {
  if (!container) {
    throw new TypeError('Container is not instantiated');
  }
  for (const typeId of typeIds) {
    bindDependency(typeId);
    updateAsyncInitializables(typeId);
  }
}

export function createContainer(
  ensuredDependencies: Nullable<ServiceIdentifier<any>[]> | 'all' | 'autoBindAll' = null,
  forceNew = false,
) {
  if (container && !forceNew) {
    throw new TypeError('Container is already instantiated. Call with `forceNew === true` to override');
  }
  if (!ensuredDependencies || ensuredDependencies === 'all') {
    containedDependencies = Array.from(typeMap.keys());
  } else if (
    ensuredDependencies === 'autoBindAll'
    || (Array.isArray(ensuredDependencies) && ensuredDependencies.length === 0)
  ) {
    containedDependencies = [];
  } else {
    const possibleDependencies = Object.values(TYPES);
    const actualDependencies = new Set(
      ensuredDependencies
        .filter(dep => possibleDependencies.includes(dep as any)),
    );
    if (actualDependencies.size === 0) {
      throw new TypeError('No type ids were specified. Please, specify them from the `TYPES` object from the `types.ts` file.');
    }
    if (actualDependencies.size !== ensuredDependencies.length) {
      throw new TypeError('Bad or duplicated type ids were specified. Please, specify them from the `TYPES` object from the `types.ts` file.');
    }
    containedDependencies = Array.from(actualDependencies);
  }
  initPromise = null;
  asyncInitializables = null;
  container = new Container({
    autoBindInjectable: true,
    defaultScope: BindingScopeEnum.Singleton,
  });
  for (const typeId of containedDependencies) {
    bindDependency(typeId);
  }

  return container;
}

let initPromise: Nullable<Promise<ReadonlyArray<any>>> = null;
let asyncInitializables: Nullable<Newable<any>[]> = null;

export function initDependenciesAsync() {
  if (!container) {
    throw new TypeError('Container is not instantiated');
  }
  if (initPromise) {
    return initPromise;
  }
  if (!asyncInitializables) {
    asyncInitializables = getAsyncInitializaables();
  }
  initPromise = Promise.all(
    asyncInitializables
      .map((typeId) => container!.get<any>(typeId)[ASYNC_INIT] as Promise<any>),
  );
  return initPromise;
}

function getAsyncInitializaables() {
  return containedDependencies!
    .map(typeId => typeof typeId === 'function'
      ? typeId
      : typeMap.get(typeId)!)
    .filter(type => !!(type as any)[ASYNC_INIT]) as Newable<any>[];
}

function updateAsyncInitializables(typeId: ServiceIdentifier<any>) {
  const type = typeof typeId !== 'function'
    ? typeMap.get(typeId)!
    : typeId as Newable<any>;
  if (!(type as any)[ASYNC_INIT]) {
    return;
  }
  if (!initPromise) {
    if (!asyncInitializables) {
      asyncInitializables = [];
    }
    asyncInitializables.push(type);
  } else {
    initPromise = Promise.all([initPromise, type]);
  }
}
