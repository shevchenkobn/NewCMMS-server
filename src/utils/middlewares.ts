import { ErrorRequestHandler, Handler } from 'express';
import { OpenAPIResponseValidatorValidationError } from 'openapi-response-validator';
import { oc } from 'ts-optchain';
import { Optional } from '../@types';
import {
  coerceLogicError,
  ErrorCode,
  LogicError,
  ResponseValidationError,
  ServerError,
} from '../services/error.service';
import { logger } from '../services/logger.service';
import { openApiSecurityHandlerTransfomMiddleware } from '../services/security-handlers.service';
import { deserializeResponseBody } from './common';
import {
  IOpenApiRequest,
  IOpenApiResponse,
  isOpenApiFinalError,
} from './openapi';

export const validateResponses: Handler = (req, res, next) => {
  const request = req as IOpenApiRequest;
  const response = res as IOpenApiResponse;

  const strictValidation = !!request.apiDoc['x-express-openapi-response-validation-strict'];
  if (typeof response.validateResponse === 'function') {
    const send = res.send;
    res.send = function expressOpenAPISend(...args) {
      const onlyWarn = !strictValidation;
      if (res.get('x-express-openapi-validation-error-for') !== undefined) {
        return send.apply(res, args);
      }
      const body = deserializeResponseBody(res, args[0]);
      const validation: Optional<
        Partial<OpenAPIResponseValidatorValidationError>
      > = response.validateResponse(
        res.statusCode as any as string,
        body,
      ) as any;
      if (!validation || !validation.errors) {
        send.apply(res, args);
        return;
      }
      let validationMessage;
      validationMessage = `Invalid response for status code ${res.statusCode} for ${req.url}: ${JSON.stringify(validation)}`;
      if (validation!.message) {
        Object.defineProperty(
          validation,
          'message',
          {
            writable: true,
            configurable: false,
            enumerable: true,
            value: validation!.message,
          },
        );
      }
      // Set to avoid a loop, and to provide the original status code
      res.set('x-express-openapi-validation-error-for', res.statusCode.toString());
      if (onlyWarn) {
        logger.warn(validationMessage);
        send.apply(res, args);
      } else {
        logger.error(validationMessage);
        res.status(500).json(new ResponseValidationError(
          validation!,
        ));
      }
    };
  }
  next();
};

export const errorHandlingPipeline: ErrorRequestHandler[] = [
  openApiSecurityHandlerTransfomMiddleware,
  (err, req, res, next) => {
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
        case ErrorCode.SERVER_OPENAPI_RESPONSE_VALIDATION:
          res.status(500);
          break;

        case ErrorCode.NOT_FOUND:
          res.status(404);
          break;

        default:
          res.status(400);
          break;
      }
      res.json(err);
    } else {
      if (isOpenApiFinalError(err)) {
        const error = coerceLogicError(err);
        res.status(err.status).json(error);
      } else {
        res.status(500).json(
          new ServerError(ErrorCode.SERVER, err),
        );
      }
    }

    if (
      res.statusCode === 500
      && err.code !== ErrorCode.SERVER_OPENAPI_RESPONSE_VALIDATION
    ) {
      logger.error(`Request server error at "${req.url}":`);
      logger.error(err);
    } else {
      logger.debug(`Request error at "${req.url}":`);
      logger.debug(err);
    }
  },
];

export const notFoundHandler: Handler = (req, res) => {
  res.status(404).json(
    new LogicError(ErrorCode.NOT_FOUND, `Route ${req.url} is not found`),
  );
};
