import { getContainer } from '../../../di/container';
import {
  getParamNameFromScriptName,
  IOpenApiPathItemHandler, jwtBearerScheme, JwtBearerScope,
} from '../../../utils/openapi';
import { ActionDevicesCommon } from '../../services/action-devices.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const actionDevicesCommon = getContainer().get<ActionDevicesCommon>(
  ActionDevicesCommon,
);

const actionDeviceIdParamName = getParamNameFromScriptName(__filename);

pathItemHandler.parameters = [
  {
    in: 'path',
    name: actionDeviceIdParamName,
    schema: {
      type: 'integer',
      format: 'int32',
      minimum: 1,
    },
    required: true,
  },
];

pathItemHandler.get = (req, res, next) => {
  actionDevicesCommon.getActionDevice(
    req.params[actionDeviceIdParamName],
    req.query.select,
  )
    .then(device => res.json(device))
    .catch(next);
};
pathItemHandler.get.apiDoc = {
  description: 'Get action device',
  tags: ['action-devices'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  parameters: [
    {
      $ref: '#/components/parameters/SelectActionDevice',
    },
  ],
  responses: {
    200: {
      description: 'Return action device',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ActionDeviceOptional',
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
  actionDevicesCommon.deleteActionDevice(
    req.params[actionDeviceIdParamName],
    req.query.select,
  )
    .then(device => res.json(device))
    .catch(next);
};
pathItemHandler.delete.apiDoc = {
  description: 'Delete action device',
  tags: ['action-devices'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  parameters: [
    {
      $ref: '#/components/parameters/SelectActionDevice',
    },
  ],
  responses: {
    200: {
      description: 'Return action device',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ActionDeviceOptional',
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
  actionDevicesCommon.updateActionDevice(
    req.params[actionDeviceIdParamName],
    req.body,
    req.query.select,
  )
    .then(device => res.json(device))
    .catch(next);
};
pathItemHandler.patch.apiDoc = {
  description: 'Update action device',
  tags: ['action-devices'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  parameters: [
    {
      $ref: '#/components/parameters/SelectActionDevice',
    },
  ],
  requestBody: {
    description: 'An action device update',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ActionDeviceUpdate',
        },
      },
    },
    required: true,
  },
  responses: {
    200: {
      description: 'Return action device',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ActionDeviceOptional',
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
