import { ASYNC_INIT, TYPES } from './types';
import {
  BindingScopeEnum,
  Container,
  interfaces,
} from 'inversify';
import { Maybe, Nullable, Optional } from '../@types';
import { DbConnection } from '../services/db-connection.class';
import ServiceIdentifier = interfaces.ServiceIdentifier;
import Request = interfaces.Request;
import { logger } from '../services/logger.service';
import { DbOrchestrator } from '../services/db-orchestrator.service';
import Newable = interfaces.Newable;
import { UsersModel } from '../models/users.model';

const typeMap = new Map<ServiceIdentifier<any>, Newable<any>>([
  [TYPES.DbConnection, DbConnection],
  [TYPES.DbOrchestrator, DbOrchestrator],

  [TYPES.UsersModel, UsersModel],
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

export function createContainer(
  trackedDependencies: Nullable<ServiceIdentifier<any>[]> | 'all' = null,
  forceNew = false,
) {
  if (container && !forceNew) {
    throw new TypeError('Container is already instantiated. Call with `forceNew === true` to override');
  }
  if (!trackedDependencies || trackedDependencies === 'all') {
    containedDependencies = Array.from(typeMap.keys());
  } else {
    const possibleDependencies = Object.values(TYPES);
    const actualDependencies = new Set(
      trackedDependencies
        .filter(dep => possibleDependencies.includes(dep as any)),
    );
    if (actualDependencies.size === 0) {
      throw new TypeError('No type ids were specified. Please, specify them from the `TYPES` object from the `types.ts` file.');
    }
    if (actualDependencies.size !== trackedDependencies.length) {
      throw new TypeError('Bad or duplicated type ids were specified. Please, specify them from the `TYPES` object from the `types.ts` file.');
    }
    containedDependencies = Array.from(actualDependencies);
  }
  initPromise = null;
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

export function initAsync() {
  if (!container) {
    throw new TypeError('Container is not instantiated');
  }
  if (initPromise) {
    return initPromise;
  }
  initPromise = Promise.all(
    containedDependencies!
      .map(typeId => typeof typeId === 'function'
        ? typeId
        : typeMap.get(typeId)!)
      .filter(type => !!(type as any)[ASYNC_INIT])
      .map((typeId) => container!.get<any>(typeId)[ASYNC_INIT] as Promise<any>),
  );
  return initPromise;
}
