import { getContainer } from '../../di/container';
import { isOpenApiSecurityHandlerError } from '../../utils/openapi';
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
  res.send({ heldlo: 'asdf' });
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
            required: ['hello'],
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
  // security: [
  //   {
  //     [jwtBearerScheme]: [JwtBearerScope.EMPLOYEE],
  //   },
  //   {
  //     [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  //   },
  // ],
};
