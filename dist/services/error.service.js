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
    ErrorCode["USER_EMAIL_DUPLICATE"] = "USER_EMAIL_DUPLICATE";
    // USER_ID_EMAIL = 'USER_EMAIL_AND_ID',
    ErrorCode["USER_PASSWORD_NO"] = "USER_PASSWORD_NO";
    ErrorCode["USER_PASSWORD_SAVE_NO"] = "USER_PASSWORD_SAVE_NO";
    ErrorCode["SELECT_BAD"] = "SELECT_BAD";
    ErrorCode["SORT_BAD"] = "SORT_BAD";
    ErrorCode["OPENAPI"] = "OPENAPI";
    ErrorCode["SERVER"] = "SERVER";
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
class ResponseValidationError extends LogicError {
    constructor(validationError, message) {
        super(ErrorCode.SERVER);
        Object.defineProperty(this, 'message', {
            enumerable: true,
            configurable: false,
            writable: false,
            value: message,
        });
        this.validationError = validationError;
    }
}
exports.ResponseValidationError = ResponseValidationError;
exports.errorTransformer = (openApiError, ajvError) => {
};
//# sourceMappingURL=error.service.js.map