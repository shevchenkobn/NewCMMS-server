import {
  ErrorCode,
  LogicError,
  ResponseValidationError,
} from '../services/error.service';
import { ErrorRequestHandler, Handler } from 'express';
import { logger } from '../services/logger.service';
import { IOpenApiRequest, IOpenApiResponse } from './openapi';
import { IRequestWithUser } from '../services/security-handlers.service';
import { DeepPartial, Optional } from '../@types';
import { OpenAPIResponseValidatorValidationError } from 'openapi-response-validator';

export const validateResponses: Handler = (req, res, next) => {
  const request = req as IOpenApiRequest;
  const response = res as IOpenApiResponse;

  const strictValidation = !!request.apiDoc['x-express-openapi-validation-strict'];
  if (typeof response.validateResponse === 'function') {
    const send = res.send;
    res.send = function expressOpenAPISend(...args) {
      const onlyWarn = !strictValidation;
      if (res.get('x-express-openapi-validation-error-for') !== undefined) {
        return send.apply(res, args);
      }
      const body = args[0];
      let validation: Optional<
        Partial<OpenAPIResponseValidatorValidationError>
      > = response.validateResponse(
        res.statusCode.toString(),
        body,
      ) as any;
      let validationMessage;
      if (!validation) {
        validation = { message: undefined, errors: undefined };
      }
      if (validation.errors) {
        // tslint:disable-next-line:max-line-length
        validationMessage = `Invalid response for status code ${res.statusCode} for ${req.url}: ${
          Array.from(validation.errors).map(_ => _.message).join(',')
        }`;
        logger.warn(validationMessage);
        // Set to avoid a loop, and to provide the original status code
        res.set('x-express-openapi-validation-error-for', res.statusCode.toString());
      }
      if (onlyWarn || !validation.errors) {
        return send.apply(res, args);
      }
      res.status(500);
      return res.json(new ResponseValidationError(
        validation,
        validationMessage,
      ));
    };
  }
  next();
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.debug('Request error: ');
  logger.debug(err);
  if (err instanceof LogicError) {
    switch (err.code) {
      case ErrorCode.AUTH_ROLE:
      case ErrorCode.AUTH_EXPIRED:
      case ErrorCode.AUTH_BAD_REFRESH:
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
