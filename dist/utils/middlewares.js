"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_service_1 = require("../services/error.service");
const logger_service_1 = require("../services/logger.service");
exports.errorHandler = (err, req, res, next) => {
    logger_service_1.logger.error('Request error: ');
    logger_service_1.logger.error(err);
    if (err instanceof error_service_1.LogicError) {
        switch (err.code) {
            case error_service_1.ErrorCode.AUTH_ROLE:
            case error_service_1.ErrorCode.AUTH_EXPIRED:
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