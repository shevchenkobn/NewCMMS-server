import { getContainer } from '../../../../../di/container';
import {
  getParamNameFromScriptName,
  IOpenApiPathItemHandler, jwtBearerScheme, JwtBearerScope,
} from '../../../../../utils/openapi';
import { UserTriggerHistoryCommon } from '../../../../services/user-trigger-history.common';
import { IRequestWithUser } from '../../../../../services/security-handlers.service';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const userTriggerHistoryCommon = getContainer().get<UserTriggerHistoryCommon>(
  UserTriggerHistoryCommon,
);

const userTriggerIdParamName = getParamNameFromScriptName(__filename);

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
    (req as IRequestWithUser).user.userId,
    req.params[userTriggerIdParamName],
  )
    .then(userTrigger => res.json(userTrigger))
    .catch(next);
};
pathItemHandler.get.apiDoc = {
  description: 'Get user trigger history item',
  tags: ['user-trigger-history'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  responses: {
    200: {
      description: 'Return user trigger history item',
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
