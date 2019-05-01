"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_service_1 = require("../services/error.service");
const logger_service_1 = require("../services/logger.service");
exports.validateResponses = (req, res, next) => {
    const request = req;
    const response = res;
    const strictValidation = !!request.apiDoc['x-express-openapi-validation-strict'];
    if (typeof response.validateResponse === 'function') {
        const send = res.send;
        res.send = function expressOpenAPISend(...args) {
            const onlyWarn = !strictValidation;
            if (res.get('x-express-openapi-validation-error-for') !== undefined) {
                return send.apply(res, args);
            }
            const body = args[0];
            let validation = response.validateResponse(res.statusCode.toString(), body);
            let validationMessage;
            if (!validation) {
                validation = { message: undefined, errors: undefined };
            }
            if (validation.errors) {
                // tslint:disable-next-line:max-line-length
                validationMessage = `Invalid response for status code ${res.statusCode} for ${req.url}: ${Array.from(validation.errors).map(_ => _.message).join(',')}`;
                logger_service_1.logger.warn(validationMessage);
                // Set to avoid a loop, and to provide the original status code
                res.set('x-express-openapi-validation-error-for', res.statusCode.toString());
            }
            if (onlyWarn || !validation.errors) {
                return send.apply(res, args);
            }
            res.status(500);
            return res.json(new error_service_1.ResponseValidationError(validation, validationMessage));
        };
    }
    next();
};
exports.errorHandler = (err, req, res, next) => {
    logger_service_1.logger.debug('Request error: ');
    logger_service_1.logger.debug(err);
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
                res.status(500);
                break;
            case error_service_1.ErrorCode.NOT_FOUND:
                res.status(404);
                break;
            default:
                res.status(400);
                break;
        }
    }
    else {
        // const httpCodeFromSwaggerError = getCodeFromSwaggerError(err, req);
        // if (httpCodeFromSwaggerError !== 0) {
        //   Object.defineProperties(err, {
        //     status: {
        //       enumerable: false,
        //     },
        //     message: {
        //       enumerable: true,
        //     },
        //   });
        //   if (!err.code) {
        //     err.code = ErrorCode.SWAGGER;
        //   }
        //   res.status(httpCodeFromSwaggerError);
        // } else {
        //   res.status(500);
        //   if (process.env.NODE_ENV === 'production') {
        //     res.json(new LogicError(ErrorCode.SERVER));
        //     return;
        //   }
        // }
    }
    res.json(err);
};
exports.notFoundHandler = (req, res) => {
    res.status(404).json(new error_service_1.LogicError(error_service_1.ErrorCode.NOT_FOUND, `Route ${req.url} is not found`));
};
//# sourceMappingURL=middlewares.js.map