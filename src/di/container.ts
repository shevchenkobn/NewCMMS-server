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

function asyncInitializablesUpdater(
  planAndResolve: interfaces.Next,
): interfaces.Next {
  return (args: interfaces.NextArgs) => {
    updateAsyncInitializables(args.serviceIdentifier);
    return planAndResolve(args);
  };
}
