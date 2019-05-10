"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_service_1 = require("../services/error.service");
class PaginationCursor {
    constructor(sortFields, previousCursor = null, dateFields = null) {
        if (sortFields.length === 0) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.SORT_NO);
        }
        this.sortFields = sortFields;
        this._previousCursorData = previousCursor
            ? decodeCursor(previousCursor, dateFields)
            : null;
        this._cursorData = this.getCursorData();
    }
    get filterField() {
        return this._cursorData[0];
    }
    toString() {
        return encodeCursor(this._cursorData);
    }
    getFilteredFieldNames() {
        return this._cursorData.map(f => f[0]);
    }
    removeIrrelevantFromList(list, makeNewList = false) {
        if (!this._previousCursorData || this._previousCursorData.length === 1) {
            return makeNewList ? list.slice() : list;
        }
        const length = this._previousCursorData.length;
        const firstSuitable = list.findIndex(item => {
            for (let i = 1; i < length; i += 1) {
                const [prop, sign, value] = this._previousCursorData[i];
                if (sign === '<') {
                    if (!(item[prop] < value)) {
                        return true;
                    }
                }
                else if (sign === '>') {
                    if (!(item[prop] > value)) {
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
    updateFromList(list) {
        if (list.length === 0) {
            return this;
        }
        const last = list[list.length - 1];
        for (const sortField of this.sortFields) {
            const direction = sortField[0];
            const fieldName = sortField.slice(1);
            const filteredField = this._cursorData.find(([name]) => name === fieldName);
            if (!filteredField) {
                this._cursorData.push([
                    fieldName,
                    direction === '<' ? '<' : '>',
                    last[fieldName],
                ]);
                continue;
            }
            const [prop, sign] = filteredField;
            const propValue = last[prop];
            if (propValue === null
                || typeof propValue === 'undefined'
                || typeof propValue === 'symbol'
                || Number.isNaN(propValue)) {
                throw new TypeError(`Unexpected value for field "${prop}": ${last[prop]}`);
            }
            const value = filteredField[2];
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
    getCursorData() {
        const cursor = [];
        if (this._previousCursorData) {
            for (const sortField of this.sortFields) {
                const fieldName = sortField.slice(1);
                const direction = sortField[0];
                const previousFilter = this._previousCursorData
                    .find(([name]) => name === fieldName);
                if (!previousFilter) {
                    continue;
                }
                if (direction === '>' && previousFilter[1] === '<'
                    || direction === '<' && previousFilter[1] === '>') {
                    throw new error_service_1.LogicError(error_service_1.ErrorCode.LIST_CURSOR_BAD);
                }
                cursor.push(previousFilter);
            }
        }
        return cursor;
    }
}
exports.PaginationCursor = PaginationCursor;
function decodeCursor(cursor, dateFields = null) {
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
    }
    catch (err) {
        throw new error_service_1.LogicError(error_service_1.ErrorCode.LIST_CURSOR_BAD);
    }
}
exports.decodeCursor = decodeCursor;
function encodeCursor(cursorData) {
    return Buffer.from(JSON.stringify(cursorData), 'utf8').toString('base64');
}
exports.encodeCursor = encodeCursor;
function applyComparatorFiltersToQuery(query, filters) {
    for (const fieldFilter of filters) {
        query.where(...fieldFilter);
    }
    return query;
}
exports.applyComparatorFiltersToQuery = applyComparatorFiltersToQuery;
function applySortingToQuery(query, sortFields) {
    for (const sortField of sortFields) {
        query.orderBy(sortField.slice(1), sortField[0] === '<' ? 'desc' : 'asc');
    }
    return query;
}
exports.applySortingToQuery = applySortingToQuery;
function assertValidSortFields(sortFields) {
    const found = new Set();
    for (const sortField of sortFields) {
        const field = sortField.slice(1);
        if (found.has(field)) {
            throw new error_service_1.LogicError(error_service_1.ErrorCode.SORT_BAD);
        }
        found.add(field);
    }
}
exports.assertValidSortFields = assertValidSortFields;
//# sourceMappingURL=model.js.map