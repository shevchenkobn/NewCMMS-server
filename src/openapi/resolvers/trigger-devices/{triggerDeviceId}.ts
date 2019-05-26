import { getContainer } from '../../../di/container';
import {
  getParamNameFromScriptName,
  IOpenApiPathItemHandler, jwtBearerScheme, JwtBearerScope,
} from '../../../utils/openapi';
import { TriggerDevicesCommon } from '../../services/trigger-devices.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const triggerDevicesCommon = getContainer().get<TriggerDevicesCommon>(
  TriggerDevicesCommon,
);

const triggerDeviceIdParamName = getParamNameFromScriptName(__filename);

pathItemHandler.parameters = [
  {
    in: 'path',
    name: triggerDeviceIdParamName,
    schema: {
      type: 'integer',
      format: 'int32',
      minimum: 1,
    },
    required: true,
  },
];

pathItemHandler.get = (req, res, next) => {
  triggerDevicesCommon.getTriggerDevice(
    req.params[triggerDeviceIdParamName],
    req.query.select,
  )
    .then(device => res.json(device))
    .catch(next);
};
pathItemHandler.get.apiDoc = {
  description: 'Get trigger device',
  tags: ['trigger-devices'],
  security: [
    {
      [jwtBearerScheme]: [JwtBearerScope.ADMIN],
    },
    {
      [jwtBearerScheme]: [JwtBearerScope.EMPLOYEE],
    },
  ],
  parameters: [
    {
      $ref: '#/components/parameters/SelectTriggerDevice',
    },
  ],
  responses: {
    200: {
      description: 'Return trigger device',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/TriggerDeviceOptional',
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
  triggerDevicesCommon.deleteTriggerDevice(
    req.params[triggerDeviceIdParamName],
    req.query.select,
  )
    .then(device => res.json(device))
    .catch(next);
};
pathItemHandler.delete.apiDoc = {
  description: 'Delete trigger device',
  tags: ['trigger-devices'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  parameters: [
    {
      $ref: '#/components/parameters/SelectTriggerDevice',
    },
  ],
  responses: {
    200: {
      description: 'Return trigger device',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/TriggerDeviceOptional',
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
  triggerDevicesCommon.updateTriggerDevice(
    req.params[triggerDeviceIdParamName],
    req.body,
    req.query.select,
  )
    .then(device => res.json(device))
    .catch(next);
};
pathItemHandler.patch.apiDoc = {
  description: 'Update trigger device',
  tags: ['trigger-devices'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  parameters: [
    {
      $ref: '#/components/parameters/SelectTriggerDevice',
    },
  ],
  requestBody: {
    description: 'A trigger device update',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/TriggerDeviceUpdate',
        },
      },
    },
    required: true,
  },
  responses: {
    200: {
      description: 'Return trigger device',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/TriggerDeviceOptional',
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
