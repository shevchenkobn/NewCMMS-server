import { getContainer } from '../../../di/container';
import {
  getParamNameFromScriptName,
  IOpenApiPathItemHandler, jwtBearerScheme, JwtBearerScope,
} from '../../../utils/openapi';
import { TriggerActionsCommon } from '../../services/trigger-actions.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const triggerActionsCommon = getContainer().get<TriggerActionsCommon>(
  TriggerActionsCommon,
);

const triggerActionIdParamName = getParamNameFromScriptName(__filename);

pathItemHandler.parameters = [
  {
    in: 'path',
    name: triggerActionIdParamName,
    schema: {
      type: 'integer',
      format: 'int32',
      minimum: 1,
    },
    required: true,
  },
];

pathItemHandler.get = (req, res, next) => {
  triggerActionsCommon.getTriggerAction(
    req.params[triggerActionIdParamName],
    req.query.select,
  )
    .then(triggerAction => res.json(triggerAction))
    .catch(next);
};
pathItemHandler.get.apiDoc = {
  description: 'Get trigger action',
  tags: ['trigger-actions'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  parameters: [
    {
      $ref: '#/components/parameters/SelectTriggerAction',
    },
  ],
  responses: {
    200: {
      description: 'Return trigger action',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/TriggerActionOptional',
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
  triggerActionsCommon.deleteTriggerAction(
    req.params[triggerActionIdParamName],
    req.query.select,
  )
    .then(triggerAction => res.json(triggerAction))
    .catch(next);
};
pathItemHandler.delete.apiDoc = {
  description: 'Delete trigger action',
  tags: ['trigger-actions'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  parameters: [
    {
      $ref: '#/components/parameters/SelectTriggerAction',
    },
  ],
  responses: {
    200: {
      description: 'Return trigger action',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/TriggerActionOptional',
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

pathItemHandler.patch = (req, res, next) => {
  triggerActionsCommon.updateTriggerAction(
    req.params[triggerActionIdParamName],
    req.body,
    req.query.select,
  )
    .then(triggerAction => res.json(triggerAction))
    .catch(next);
};
pathItemHandler.patch.apiDoc = {
  description: 'Update trigger action',
  tags: ['trigger-actions'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  parameters: [
    {
      $ref: '#/components/parameters/SelectTriggerAction',
    },
  ],
  requestBody: {
    description: 'An trigger action update',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/TriggerActionUpdate',
        },
      },
    },
    required: true,
  },
  responses: {
    200: {
      description: 'Return trigger action',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/TriggerActionOptional',
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
