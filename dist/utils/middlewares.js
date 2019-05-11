"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_service_1 = require("../services/error.service");
const logger_service_1 = require("../services/logger.service");
const security_handlers_service_1 = require("../services/security-handlers.service");
const common_1 = require("./common");
const openapi_1 = require("./openapi");
exports.validateResponses = (req, res, next) => {
    const request = req;
    const response = res;
    const strictValidation = !!request.apiDoc['x-express-openapi-response-validation-strict'];
    if (typeof response.validateResponse === 'function') {
        const send = res.send;
        res.send = function expressOpenAPISend(...args) {
            const onlyWarn = !strictValidation;
            if (res.get('x-express-openapi-validation-error-for') !== undefined) {
                return send.apply(res, args);
            }
            const body = common_1.deserializeResponseBody(res, args[0]);
            const validation = response.validateResponse(res.statusCode, body);
            if (!validation || !validation.errors) {
                send.apply(res, args);
                return;
            }
            let validationMessage;
            validationMessage = `Invalid response for status code ${res.statusCode} for ${req.url}: ${JSON.stringify(validation)}`;
            if (validation.message) {
                Object.defineProperty(validation, 'message', {
                    writable: true,
                    configurable: false,
                    enumerable: true,
                    value: validation.message,
                });
            }
            // Set to avoid a loop, and to provide the original status code
            res.set('x-express-openapi-validation-error-for', res.statusCode.toString());
            if (onlyWarn) {
                logger_service_1.logger.warn(validationMessage);
                send.apply(res, args);
            }
            else {
                logger_service_1.logger.error(validationMessage);
                res.status(500).json(new error_service_1.ResponseValidationError(validation));
            }
        };
    }
    next();
};
exports.errorHandlingPipeline = [
    security_handlers_service_1.openApiSecurityHandlerTransfomMiddleware,
    (err, req, res, next) => {
        if (err instanceof error_service_1.LogicError) {
            switch (err.code) {
                case error_service_1.ErrorCode.AUTH_ROLE:
                case error_service_1.ErrorCode.AUTH_EXPIRED:
                case error_service_1.ErrorCode.AUTH_BAD_REFRESH:
                case error_service_1.ErrorCode.SELECT_BAD:
                    res.status(403);
                    break;
                case error_service_1.ErrorCode.AUTH_NO:
                case error_service_1.ErrorCode.AUTH_BAD:
                case error_service_1.ErrorCode.AUTH_BAD_SCHEME:
                    res.status(401);
                    break;
                case error_service_1.ErrorCode.SERVER:
                case error_service_1.ErrorCode.SERVER_OPENAPI_RESPONSE_VALIDATION:
                    res.status(500);
                    break;
                case error_service_1.ErrorCode.NOT_FOUND:
                    res.status(404);
                    break;
                default:
                    res.status(400);
                    break;
            }
            res.json(err);
        }
        else {
            if (err instanceof SyntaxError && err.message.includes('JSON')) {
                res.status(400)
                    .json(new error_service_1.LogicError(error_service_1.ErrorCode.JSON_BAD, err.message, err));
            }
            else if (openapi_1.isOpenApiFinalError(err)) {
                const error = error_service_1.coerceLogicError(err);
                res.status(err.status).json(error);
            }
            else {
                res.status(500).json(new error_service_1.ServerError(error_service_1.ErrorCode.SERVER, err));
            }
        }
        if (res.statusCode === 500
            && err.code !== error_service_1.ErrorCode.SERVER_OPENAPI_RESPONSE_VALIDATION) {
            logger_service_1.logger.error(`Request server error at "${req.url}":`);
            logger_service_1.logger.error(err);
        }
        else {
            logger_service_1.logger.debug(`Request error at "${req.url}":`);
            logger_service_1.logger.debug(err);
        }
    },
];
exports.notFoundHandler = (req, res) => {
    res.status(404).json(new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND, `Route ${req.url} is not found`));
};
//# sourceMappingURL=middlewares.js.map