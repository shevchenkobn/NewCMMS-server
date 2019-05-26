import { getContainer } from '../../../../di/container';
import {
  getParamNamesFromScriptPath,
  IOpenApiPathItemHandler,
  jwtBearerScheme, JwtBearerScope,
} from '../../../../utils/openapi';
import { UserTriggerHistoryCommon } from '../../../services/user-trigger-history.common';
import { IRequestWithUser } from '../../../../services/security-handlers.service';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const userTriggerHistoryCommon = getContainer().get<UserTriggerHistoryCommon>(
  UserTriggerHistoryCommon,
);

pathItemHandler.get = (req, res, next) => {
  userTriggerHistoryCommon.getUserTriggers(
    (req as IRequestWithUser).user.userId,
  )
    .then(userTrigger => res.json(userTrigger))
    .catch(next);
};
pathItemHandler.get.apiDoc = {
  description: 'Get trigger history for an authenticated identity',
  tags: ['user-trigger-history', 'auth'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.EMPLOYEE],
  }],
  responses: {
    200: {
      description: 'Get user trigger history',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              cursor: {
                $ref: '#/components/schemas/Cursor',
              },
              userTriggers: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/UserTrigger',
                },
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
    400: {
      $ref: '#/components/responses/BadRequest',
    },
    401: {
      $ref: '#/components/responses/Unauthenticated',
    },
    403: {
      $ref: '#/components/responses/Forbidden',
    },
    404: {
      $ref: '#/components/responses/NotFound',
    },
  },
};
