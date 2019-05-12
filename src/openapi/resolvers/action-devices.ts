import { getContainer } from '../../di/container';
import {
  IOpenApiPathItemHandler,
  jwtBearerScheme,
  JwtBearerScope,
} from '../../utils/openapi';
import { ActionDevicesCommon } from '../services/action-devices.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const actionDevicesCommon = getContainer().get<ActionDevicesCommon>(
  ActionDevicesCommon,
);

pathItemHandler.post = (req, res, next) => {
  actionDevicesCommon.createActionDevice(req.body, req.query.select).then(
    device => res.status(201).json(device),
  ).catch(next);
};
pathItemHandler.post.apiDoc = {
  description: 'Create action device',
  tags: ['trigger-devices'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  requestBody: {
    description: 'An action device to create',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ActionDeviceCreate',
        },
      },
    },
    required: true,
  },
  parameters: [
    {
      $ref: '#/components/parameters/SelectActionDevice',
    },
  ],
  responses: {
    201: {
      description: 'The action device was created. Optional object of it',
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
  },
};

const actionDeviceIdsParameterName = 'action-device-ids';
