import { ErrorCode, LogicError } from '../services/error.service';
import { ErrorRequestHandler, Handler } from 'express';
import { logger } from '../services/logger.service';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error('Request error: ');
  logger.error(err);
  if (err instanceof LogicError) {
    switch (err.code) {
      case ErrorCode.AUTH_ROLE:
      case ErrorCode.AUTH_EXPIRED:
      case ErrorCode.SELECT_BAD:
        res.status(403);
        break;

      case ErrorCode.AUTH_NO:
      case ErrorCode.AUTH_BAD:
      case ErrorCode.AUTH_BAD_SCHEME:
        res.status(401);
        break;

      case ErrorCode.SERVER:
        res.status(500);
        break;

      case ErrorCode.NOT_FOUND:
        res.status(404);
        break;

      default:
        res.status(400);
        break;
    }
  } else {
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

export const notFoundHandler: Handler = (req, res) => {
  res.status(404).json(
    new LogicError(ErrorCode.NOT_FOUND, `Route ${req.url} is not found`),
  );
};
