import { ASYNC_INIT, TYPES } from './types';
import { Container } from 'inversify';
import { Maybe } from '../@types';

const typeMap = new Map<symbol, any>([

]);

let container: Maybe<Container> = null;
let containedDependencies: Maybe<symbol[]> = null;

export function getContainer() {
  if (!container) {
    throw new TypeError('Container is not instantiated');
  }
  return container;
}

export function createContainer(
  dependencies: Maybe<symbol[]>,
  forceNew = false,
) {
  if (container && !forceNew) {
    throw new TypeError('Container is already instantiated. Call with `forceNew === true` to override');
  }
  if (!dependencies) {
    containedDependencies = [...typeMap.keys()];
  } else {
    const possibleDependencies = Object.values(TYPES);
    const actualDependencies = dependencies
      .filter(dep => possibleDependencies.includes(dep));
    if (actualDependencies.length === 0) {
      throw new TypeError('No type ids were specified. Please, specify them from the `TYPES` object from the `types.ts` file.');
    }
    if (actualDependencies.length !== dependencies.length) {
      throw new TypeError('Bad type ids were specified. Please, specify them from the `TYPES` object from the `types.ts` file.');
    }
    containedDependencies = actualDependencies;
  }
  initPromise = null;
  container = new Container({
    defaultScope: 'Singleton',
  });
  for (const [typeId, type] of typeMap) {
    if (containedDependencies.includes(typeId)) {
      container.bind<any>(typeId).to(type);
    }
  }
  return container;
}

let initPromise: Promise<any[]> | null = null;
export function initAsync() {
  if (!container) {
    throw new TypeError('Container is not instantiated');
  }
  if (initPromise) {
    return initPromise;
  }
  initPromise = Promise.all(
    containedDependencies!
      .map((typeId) => container!.get<any>(typeId)[ASYNC_INIT] as Promise<any>),
  );
  return initPromise;
}
