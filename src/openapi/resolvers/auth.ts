import { getContainer } from '../../di/container';
import { IUserCredentials } from '../../models/users.model';
import {
  IOpenApiPathItemHandler,
  JwtBearerScope,
  jwtBearerScheme,
} from '../../utils/openapi';
import { AuthCommon } from '../services/auth.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const authCommon = getContainer().get<AuthCommon>(AuthCommon);

pathItemHandler.post = (req, res, next) => {
  const credentials = req.body as IUserCredentials;
  authCommon.getTokensForUser(credentials)
    .then(tokens => res.json(tokens))
    .catch(next);
};

pathItemHandler.post.apiDoc = {
  description: 'Acquire a token pair',
  requestBody: {
    description: 'Credentials to log in with',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              $ref: '#/components/schemas/UserPassword',
            },
          },
          additionalProperties: false,
        },
      },
    },
    required: true,
  },
  responses: {
    200: {
      description: 'Login Successful',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/TokenPair',
          },
        },
      },
    },
    400: {
      $ref: '#/components/responses/OpenApiBadRequest',
    },
    401: {
      description: 'Error in login data provided',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error',
          },
        },
      },
    },
  },
};
