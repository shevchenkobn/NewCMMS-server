import { getContainer } from '../../di/container';
import {
  IOpenApiPathItemHandler,
  JwtBearerScope,
  jwtBearerScheme,
} from '../../utils/openapi';
import { AuthCommon } from '../services/auth.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const authCommon = getContainer().get<AuthCommon>(AuthCommon);

pathItemHandler.post = async (req, res, next) => {
  res.json({ hello: 'world' });
};
pathItemHandler.post.apiDoc = {
  description: 'test',
  responses: {
    200: {
      description: 'test',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              hello: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
  security: [{
    [jwtBearerScheme]: [],
  }],
};
