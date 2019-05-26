"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mime_1 = require("mime");
const logger_service_1 = require("../services/logger.service");
function isPositiveInteger(num) {
    return Number.isSafeInteger(num) && num > 0;
}
exports.isPositiveInteger = isPositiveInteger;
function deserializeResponseBody(res, body) {
    if (typeof body !== 'string') {
        return body;
    }
    const type = mime_1.getExtension(res.get('Content-Type').split(/;\s*/)[0]);
    switch (type) {
        case 'json':
            return JSON.parse(body);
        default:
            logger_service_1.logger.warn(`Unexpected body type: ${type}. Returning string`);
            return body;
    }
}
exports.deserializeResponseBody = deserializeResponseBody;
function mergeArrays(...arrays) {
    const set = new Set();
    for (const array of arrays) {
        for (const item of array) {
            set.add(item);
        }
    }
    return Array.from(set.values());
}
exports.mergeArrays = mergeArrays;
function differenceArrays(array, ...arrays) {
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
exports.differenceArrays = differenceArrays;
function getLazyMapper(mapper) {
    return function* (arr) {
        for (const item of arr) {
            yield mapper(item);
        }
    };
}
exports.getLazyMapper = getLazyMapper;
function deletePropsFromArray(objects, keys) {
    for (const obj of objects) {
        deleteProps(obj, keys);
    }
    return objects;
}
exports.deletePropsFromArray = deletePropsFromArray;
function deleteProps(obj, keys) {
    for (const key of keys) {
        delete obj[key];
    }
    return obj;
}
exports.deleteProps = deleteProps;
const physicalAddressRegex = /^[\dA-F]{12}$/i;
function isPhysicalAddress(address) {
    return physicalAddressRegex.test(address);
}
exports.isPhysicalAddress = isPhysicalAddress;
function normalizePhysicalAddress(address) {
    return address.split(/[-:.]/).join('').toLowerCase();
}
exports.normalizePhysicalAddress = normalizePhysicalAddress;
//# sourceMappingURL=common.js.map