import { IOpenApiPathItemHandler } from '../../../utils/openapi';
import { getContainer } from '../../../di/container';
import { AuthCommon, ITokenPair } from '../../services/auth.common';
import { Optional } from '../../../@types';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const authCommon = getContainer().get<AuthCommon>(AuthCommon);

const includeRefreshTokenParamName = 'include-refresh-token';
pathItemHandler.post = (req, res, next) => {
  const tokenPair = req.body as ITokenPair;
  authCommon.getNewAccessToken(tokenPair)
    .then(accessToken => {
      const newTokens = { accessToken } as ITokenPair;
      const includeRefreshToken = req.query[includeRefreshTokenParamName] as
        Optional<boolean>;
      if (includeRefreshToken) {
        newTokens.refreshToken = tokenPair.refreshToken;
      }
      res.json(newTokens);
    })
    .catch(next);
};

pathItemHandler.post.apiDoc = {
  description: 'Acquire a token pair',
  tags: ['auth'],
  parameters: [
    {
      in: 'query',
      name: includeRefreshTokenParamName,
      description: 'Whether include refresh token in response or not',
      required: false,
      schema: {
        type: 'boolean',
        default: false,
      },
    },
  ],
  requestBody: {
    description: 'Credentials to log in with',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/TokenPair',
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
            type: 'object',
            required: ['accessToken'],
            properties: {
              accessToken: {
                type: 'string',
              },
              refreshToken: {
                type: 'string',
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
    400: {
      $ref: '#/components/responses/OpenApiBadRequest',
    },
    401: {
      description: 'Error in tokens provided',
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
