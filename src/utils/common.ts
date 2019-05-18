import { Response } from 'express';
import { getExtension } from 'mime';
import { logger } from '../services/logger.service';

export function isPositiveInteger(num: number) {
  return Number.isSafeInteger(num) && num > 0;
}

export function deserializeResponseBody(res: Response, body: any) {
  if (typeof body !== 'string') {
    return body;
  }
  const type = getExtension(res.get('Content-Type').split(/;\s*/)[0]);
  switch (type) {
    case 'json':
      return JSON.parse(body);
    default:
      logger.warn(`Unexpected body type: ${type}. Returning string`);
      return body;
  }
}

export function mergeArrays<T = any>(
  ...arrays: ReadonlyArray<ReadonlyArray<T>>
) {
  const set = new Set();
  for (const array of arrays) {
    for (const item of array) {
      set.add(item);
    }
  }
  return Array.from(set.values());
}

export function differenceArrays<T = any>(
  array: ReadonlyArray<T>,
  ...arrays: ReadonlyArray<ReadonlyArray<T>>
) {
  return array.filter(item => {
    for (const array of arrays) {
      const includes = array.includes(item);
      if (includes) {
        return false;
      }
    }
    return true;
  });
}

export function getLazyMapper<TIn, TOut>(mapper: (item: TIn) => TOut) {
  return function* (arr: ReadonlyArray<TIn>) {
    for (const item of arr) {
      yield mapper(item);
    }
  };
}

export function deletePropsFromArray<
  T extends Record<string, any>, K extends keyof T
>(objects: ReadonlyArray<T>, keys: ReadonlyArray<K>) {
  for (const obj of objects) {
    deleteProps(obj, keys);
  }
  return objects;
}

export function deleteProps<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: ReadonlyArray<K>,
): Extract<T, Pick<T, K>> {
  for (const key of keys) {
    delete obj[key];
  }
  return obj;
}

const physicalAddressRegex = /^[\dA-F]{12}$/i;
export function isPhysicalAddress(address: string) {
  return physicalAddressRegex.test(address);
}

export function normalizePhysicalAddress(address: string) {
  return address.split(/[-:.]/).join('').toLowerCase();
}
