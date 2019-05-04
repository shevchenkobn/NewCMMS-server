"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["AUTH_NO"] = "AUTH_NO";
    ErrorCode["AUTH_ROLE"] = "AUTH_ROLE";
    ErrorCode["AUTH_BAD"] = "AUTH_BAD";
    ErrorCode["AUTH_BAD_SCHEME"] = "AUTH_BAD_SCHEME";
    ErrorCode["AUTH_BAD_REFRESH"] = "AUTH_BAD_SCHEME";
    ErrorCode["AUTH_EXPIRED"] = "AUTH_EXPIRED";
    ErrorCode["USER_ROLE_BAD"] = "USER_ROLE_BAD";
    ErrorCode["USER_FILTER_BAD"] = "USER_FILTER_BAD";
    ErrorCode["USER_EMAIL_BAD"] = "USER_EMAIL_BAD";
    ErrorCode["USER_EMAIL_DUPLICATE"] = "USER_EMAIL_DUPLICATE";
    ErrorCode["USER_EMAIL_AND_ID"] = "USER_EMAIL_AND_ID";
    ErrorCode["USER_PASSWORD_NO"] = "USER_PASSWORD_NO";
    ErrorCode["USER_PASSWORD_BAD"] = "USER_PASSWORD_BAD";
    ErrorCode["USER_PASSWORD_SAVE_NO"] = "USER_PASSWORD_SAVE_NO";
    ErrorCode["SELECT_BAD"] = "SELECT_BAD";
    ErrorCode["SORT_BAD"] = "SORT_BAD";
    ErrorCode["OPENAPI_VALIDATION"] = "OPENAPI_VALIDATION";
    ErrorCode["SERVER"] = "SERVER";
    ErrorCode["SERVER_OPENAPI_RESPONSE_VALIDATION"] = "SERVER_OPENAPI_RESPONSE_VALIDATION";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
class LogicError extends TypeError {
    constructor(code, message) {
        if (!message) {
            super(code);
        }
        else {
            super(message);
        }
        this.code = code;
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