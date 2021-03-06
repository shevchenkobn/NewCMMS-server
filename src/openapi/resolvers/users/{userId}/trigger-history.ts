import { getContainer } from '../../../../di/container';
import {
  getParamNamesFromScriptPath,
  IOpenApiPathItemHandler,
  jwtBearerScheme, JwtBearerScope,
} from '../../../../utils/openapi';
import { UserTriggerHistoryCommon } from '../../../services/user-trigger-history.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const userTriggerHistoryCommon = getContainer().get<UserTriggerHistoryCommon>(
  UserTriggerHistoryCommon,
);

const [userIdParamName] = getParamNamesFromScriptPath(__filename);

pathItemHandler.get = (req, res, next) => {
  userTriggerHistoryCommon.getUserTriggers(
    req.params[userIdParamName],
  )
    .then(userTrigger => res.json(userTrigger))
    .catch(next);
};
pathItemHandler.get.apiDoc = {
  description: 'Get user trigger history',
  tags: ['user-trigger-history'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
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
