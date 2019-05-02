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
//# sourceMappingURL=common.js.map