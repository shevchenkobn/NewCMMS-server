import { QueryBuilder } from 'knex';
import { DeepReadonly, Nullable, primitive } from '../@types';
import { ErrorCode, LogicError } from '../services/error.service';

export type StrictComparisonSign = '<' | '>';
export type ComparisonSign = StrictComparisonSign | '<=' | '>=';
export type FieldValue = primitive | Date;

export type ComparatorFilters<T> = [keyof T, ComparisonSign, FieldValue][];
export type CursorData<T> = [keyof T, StrictComparisonSign, FieldValue][];

export class PaginationCursor<T extends object> {
  readonly sortFields: ReadonlyArray<string>;
  readonly cursorData: CursorData<T>;

  constructor(
    sortFields: ReadonlyArray<string>,
    previousCursor: Nullable<string> = null,
    dateFields: Nullable<ReadonlyArray<keyof T>> = null,
  ) {
    if (sortFields.length === 0) {
      throw new LogicError(ErrorCode.SORT_NO);
    }
    this.sortFields = sortFields;
    this.cursorData = this.getCursor(
      previousCursor
        ? decodeCursor<T>(previousCursor, dateFields)
        : null,
    );
  }

  toString() {
    return encodeCursor<T>(this.cursorData);
  }

  getFilteredFieldNames() {
    return this.cursorData.map(f => f[0]);
  }

  updateFromList(list: ReadonlyArray<T>) {
    const last = list[list.length - 1];
    for (const filteredField of this.cursorData) {
      const [prop, sign] = filteredField;
      const propValue = last[prop] as any;
      if (
        propValue === null
        || typeof propValue === 'undefined'
        || typeof propValue === 'symbol'
        || Number.isNaN(propValue)
      ) {
        throw new TypeError(`Unexpected value for field "${prop}": ${last[prop]}`);
      }
      const value = filteredField[2] as
        Exclude<FieldValue, undefined | null | symbol>;
      switch (sign) {
        case '<':
          if (propValue < value) {
            filteredField[2] = propValue;
          }
          break;
        case '>':
          if (propValue > value) {
            filteredField[2] = propValue;
          }
          break;
      }
    }
    return this;
  }

  protected getCursor(
    previousCursor: Nullable<CursorData<T>> = null,
  ): CursorData<T> {
    const cursor = [] as CursorData<T>;
    if (previousCursor) {
      for (const sortField of this.sortFields as ReadonlyArray<string>) {
        const fieldName = sortField.slice(1);
        const direction = sortField[0];
        const previousFilter = previousCursor
          .find(([name]) => name === fieldName);
        if (!previousFilter) {
          continue;
        }
        if (
          direction === '+' && previousFilter[1] === '<'
          || direction === '-' && previousFilter[1] === '>'
        ) {
          throw new LogicError(ErrorCode.LIST_CURSOR_BAD);
        }
        cursor.push(previousFilter);
      }
    }
    return cursor;
  }
}

export function decodeCursor<T>(
  cursor: string,
  dateFields: Nullable<ReadonlyArray<keyof T>> = null,
): CursorData<T> {
  try {
    const cursorFilter = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
    if (dateFields && dateFields.length > 0) {
      for (const field of dateFields) {
        cursorFilter[field] = Date.parse(cursorFilter[field]);
      }
    }
    return cursorFilter;
  } catch (err) {
    throw new LogicError(ErrorCode.LIST_CURSOR_BAD);
  }
}

export function encodeCursor<T>(cursorData: CursorData<T>) {
  return Buffer.from(JSON.stringify(cursorData), 'utf8').toString('base64');
}

export function applyComparatorFiltersToQuery<T = any>(
  query: QueryBuilder,
  filters: ComparatorFilters<T>,
) {
  for (const fieldFilter of filters) {
    query.where(...(fieldFilter as [string, string, any]));
  }
  return query;
}

export function applySortingToQuery(
  query: QueryBuilder,
  sortFields: ReadonlyArray<string>,
) {
  for (const sortField of sortFields) {
    query.orderBy(sortField.slice(1), sortField[0] === '-' ? 'desc' : 'asc');
  }
  return query;
}

export function assertValidSortFields(sortFields: ReadonlyArray<string>) {
  const found = new Set<string>();
  for (const sortField of sortFields) {
    const field = sortField.slice(1);
    if (found.has(field)) {
      throw new LogicError(ErrorCode.SORT_BAD);
    }
    found.add(field);
  }
}
