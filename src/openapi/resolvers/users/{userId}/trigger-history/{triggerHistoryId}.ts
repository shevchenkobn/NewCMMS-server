import { getContainer } from '../../../../../di/container';
import {
  getParamNamesFromScriptPath,
  IOpenApiPathItemHandler, jwtBearerScheme, JwtBearerScope,
} from '../../../../../utils/openapi';
import { UserTriggerHistoryCommon } from '../../../../services/user-trigger-history.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const userTriggerHistoryCommon = getContainer().get<UserTriggerHistoryCommon>(
  UserTriggerHistoryCommon,
);

const [userIdParamName, userTriggerIdParamName] = getParamNamesFromScriptPath(
  __filename,
);

pathItemHandler.parameters = [
  {
    in: 'path',
    name: userTriggerIdParamName,
    schema: {
      type: 'integer',
      format: 'int32',
      minimum: 1,
    },
    required: true,
  },
];

pathItemHandler.get = (req, res, next) => {
  userTriggerHistoryCommon.getUserTrigger(
    req.params[userIdParamName],
    req.params[userTriggerIdParamName],
  )
    .then(userTrigger => res.json(userTrigger))
    .catch(next);
};
pathItemHandler.get.apiDoc = {
  description: 'Get username trigger history item',
  tags: ['username-trigger-history'],
  security: [
    {
      [jwtBearerScheme]: [JwtBearerScope.EMPLOYEE],
    },
    {
      [jwtBearerScheme]: [JwtBearerScope.ADMIN],
    },
  ],
  responses: {
    200: {
      description: 'Return username trigger history item',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/UserTrigger',
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

pathItemHandler.delete = (req, res, next) => {
  userTriggerHistoryCommon.deleteUserTrigger(
    req.params[userIdParamName],
    req.params[userTriggerIdParamName],
  )
    .then(userTrigger => res.json(userTrigger))
    .catch(next);
};
pathItemHandler.delete.apiDoc = {
  description: 'Delete username trigger history item',
  tags: ['username-trigger-history'],
  security: [
    {
      [jwtBearerScheme]: [JwtBearerScope.ADMIN],
    },
  ],
  responses: {
    200: {
      description: 'Return username trigger history item',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/UserTrigger',
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
