"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["JSON_BAD"] = "JSON_BAD";
    ErrorCode["SELECT_BAD"] = "SELECT_BAD";
    ErrorCode["SORT_NO"] = "SORT_NO";
    ErrorCode["SORT_BAD"] = "SORT_BAD";
    ErrorCode["LIST_CURSOR_BAD"] = "LIST_CURSOR_BAD";
    ErrorCode["OPENAPI_VALIDATION"] = "OPENAPI_VALIDATION";
    ErrorCode["SERVER"] = "SERVER";
    ErrorCode["SERVER_OPENAPI_RESPONSE_VALIDATION"] = "SERVER_OPENAPI_RESPONSE_VALIDATION";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["AUTH_NO"] = "AUTH_NO";
    ErrorCode["AUTH_ROLE"] = "AUTH_ROLE";
    ErrorCode["AUTH_BAD"] = "AUTH_BAD";
    ErrorCode["AUTH_BAD_SCHEME"] = "AUTH_BAD_SCHEME";
    ErrorCode["AUTH_BAD_REFRESH"] = "AUTH_BAD_REFRESH";
    ErrorCode["AUTH_EXPIRED"] = "AUTH_EXPIRED";
    ErrorCode["USER_ROLE_BAD"] = "USER_ROLE_BAD";
    ErrorCode["USER_FILTER_BAD"] = "USER_FILTER_BAD";
    ErrorCode["USER_CREDENTIALS_BAD"] = "USER_CREDENTIALS_BAD";
    ErrorCode["USER_EMAIL_DUPLICATE"] = "USER_EMAIL_DUPLICATE";
    ErrorCode["USER_EMAIL_AND_ID"] = "USER_EMAIL_AND_ID";
    ErrorCode["USER_PASSWORD_NO"] = "USER_PASSWORD_NO";
    ErrorCode["USER_PASSWORD_SAVE_NO"] = "USER_PASSWORD_SAVE_NO";
    ErrorCode["USER_PASSWORD_PROVIDED"] = "USER_PASSWORD_PROVIDED";
    ErrorCode["TRIGGER_DEVICE_NAME_DUPLICATE"] = "TRIGGER_DEVICE_NAME_DUPLICATE";
    ErrorCode["TRIGGER_DEVICE_MAC_DUPLICATE"] = "TRIGGER_DEVICE_MAC_DUPLICATE";
    ErrorCode["TRIGGER_DEVICE_ID_AND_NAME"] = "TRIGGER_DEVICE_ID_AND_NAME";
    ErrorCode["ACTION_DEVICE_NAME_DUPLICATE"] = "ACTION_DEVICE_NAME_DUPLICATE";
    ErrorCode["ACTION_DEVICE_MAC_DUPLICATE"] = "ACTION_DEVICE_MAC_DUPLICATE";
    ErrorCode["TRIGGER_ACTION_BAD_TRIGGER_DEVICE_ID"] = "TRIGGER_ACTION_BAD_TRIGGER_DEVICE_ID";
    ErrorCode["TRIGGER_ACTION_BAD_ACTION_DEVICE_ID"] = "TRIGGER_ACTION_BAD_ACTION_DEVICE_ID";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
class LogicError extends TypeError {
    constructor(code, message, innerError) {
        if (!message) {
            super(code);
        }
        else {
            super(message);
        }
        this.code = code;
        if (innerError !== undefined) {
            this.innerError = innerError;
        }
    }
}
exports.LogicError = LogicError;
class OpenApiValidationError extends Error {
    constructor(openApiError, jsonSchemaError, message) {
        super(message);
        this.openApiError = openApiError;
        this.jsonSchemaError = jsonSchemaError;
    }
}
exports.OpenApiValidationError = OpenApiValidationError;
class ServerError extends LogicError {
    constructor(code, innerError, message) {
        super(code);
        this.innerError = innerError;
        if (message) {
            Object.defineProperty(this, 'message', {
                enumerable: true,
                configurable: false,
                writable: false,
                value: message,
            });
        }
    }
}
exports.ServerError = ServerError;
class ResponseValidationError extends ServerError {
    constructor(validationError, message) {
        super(ErrorCode.SERVER_OPENAPI_RESPONSE_VALIDATION, validationError, message);
    }
}
exports.ResponseValidationError = ResponseValidationError;
exports.errorTransformer = (openApiError, ajvError) => {
    return new OpenApiValidationError(openApiError, ajvError);
};
function coerceLogicError(err) {
    const error = err;
    error.code = ErrorCode.OPENAPI_VALIDATION;
    return error;
}
exports.coerceLogicError = coerceLogicError;
//# sourceMappingURL=error.service.js.map