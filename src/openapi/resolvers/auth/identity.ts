import { IRequestWithUser } from '../../../services/security-handlers.service';
import {
  IOpenApiPathItemHandler,
  jwtBearerScheme,
} from '../../../utils/openapi';
import { getContainer } from '../../../di/container';
import { AuthCommon } from '../../services/auth.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const authCommon = getContainer().get<AuthCommon>(AuthCommon);

pathItemHandler.get = (req, res, next) => {
  // This handler does not utilize authCommon because it would be counterintuitive and redundant
  res.json((req as IRequestWithUser).user);
};
pathItemHandler.get.apiDoc = {
  description: 'Get identity of authenticated user',
  security: [{
    [jwtBearerScheme]: [],
  }],
  responses: {
    200: {
      description: 'Login Successful',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/User',
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/Unauthenticated',
    },
  },
};
