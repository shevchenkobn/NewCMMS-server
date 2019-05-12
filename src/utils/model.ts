import { QueryBuilder } from 'knex';
import { DeepReadonly, Nullable, Optional, primitive } from '../@types';
import { ErrorCode, LogicError } from '../services/error.service';

export type StrictComparisonSign = '<' | '>';
export type ComparisonSign = StrictComparisonSign | '<=' | '>=';
export type FieldValue = primitive | Date;

export type ComparatorFilters<T> = [keyof T, ComparisonSign, FieldValue][];
export type CursorData<T> = [keyof T, StrictComparisonSign, FieldValue][];

export class PaginationCursor<T extends object> {
  readonly sortFields: ReadonlyArray<string>;
  protected readonly _cursorData: CursorData<T>;
  protected readonly _previousCursorData: Nullable<CursorData<T>>;

  get filterField(): Optional<DeepReadonly<CursorData<T>[0]>> {
    return this._cursorData[0];
  }

  constructor(
    sortFields: ReadonlyArray<string>,
    previousCursor: Nullable<string> = null,
    dateFields: Nullable<ReadonlyArray<keyof T>> = null,
  ) {
    if (sortFields.length === 0) {
      throw new LogicError(ErrorCode.SORT_NO);
    }
    this.sortFields = sortFields;
    this._previousCursorData = previousCursor
      ? decodeCursor<T>(previousCursor, dateFields)
      : null;
    this._cursorData = this.getCursorData();
  }

  toString() {
    return encodeCursor<T>(this._cursorData);
  }

  getFilteredFieldNames() {
    return this._cursorData.map(f => f[0]);
  }

  removeIrrelevantFromList(list: T[], makeNewList?: false): T[];
  removeIrrelevantFromList(
    list: ReadonlyArray<T>,
    makeNewList: true,
  ): ReadonlyArray<T>;
  removeIrrelevantFromList(list: T[], makeNewList = false): T[] {
    if (!this._previousCursorData || this._previousCursorData.length === 1) {
      return makeNewList ? list.slice() : list;
    }
    const length = this._previousCursorData.length;
    const firstSuitable = list.findIndex(item => {
      for (let i = 1; i < length; i += 1) {
        const [prop, sign, value] = this._previousCursorData![i];
        if (sign === '<') {
          if (!(item[prop] < (value as any))) {
            return true;
          }
        } else if (sign === '>') {
          if (!(item[prop] > (value as any))) {
            return true;
          }
        }
      }
      return false;
    });
    if (firstSuitable < 0) {
      return makeNewList ? list.slice() : list;
    }
    if (makeNewList) {
      return list.slice(firstSuitable);
    }
    list.splice(0, firstSuitable);
    return list;
  }

  updateFromList(list: ReadonlyArray<T>) {
    if (list.length === 0) {
      return this;
    }
    const last = list[list.length - 1];
    for (const sortField of this.sortFields) {
      const direction = sortField[0];
      const fieldName = sortField.slice(1);
      const filteredField = this._cursorData.find(
        ([name]) => name === fieldName,
      );
      if (!filteredField) {
        this._cursorData.push([
          fieldName as (keyof T),
          direction === '<' ? '<' : '>', // For flexibility of the code
          (last as any)[fieldName],
        ]);
        continue;
      }
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

  protected getCursorData(): CursorData<T> {
    const cursor = [] as CursorData<T>;
    if (this._previousCursorData) {
      for (const sortField of this.sortFields as ReadonlyArray<string>) {
        const fieldName = sortField.slice(1);
        const direction = sortField[0];
        const previousFilter = this._previousCursorData
          .find(([name]) => name === fieldName);
        if (!previousFilter) {
          continue;
        }
        if (
          direction === '>' && previousFilter[1] === '<'
          || direction === '<' && previousFilter[1] === '>'
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
        if (field in cursorFilter) {
          cursorFilter[field] = new Date(cursorFilter[field]);
        }
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
    query.orderBy(sortField.slice(1), sortField[0] === '<' ? 'desc' : 'asc');
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

export function getSortFields<T>(columnNames: ReadonlyArray<keyof T>) {
  return columnNames.flatMap(p => [`<${p}`, `>${p}`]);
}
