import { getContainer } from '../../di/container';
import { getSortFields } from '../../utils/model';
import { getAllActionDevicePropertyNames } from '../../utils/models/action-devices';
import {
  IOpenApiPathItemHandler,
  jwtBearerScheme,
  JwtBearerScope,
} from '../../utils/openapi';
import { ActionDevicesCommon } from '../services/action-devices.common';
import { OpenAPIV3 } from 'openapi-types';

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
  tags: ['action-devices'],
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

pathItemHandler.get = (req, res, next) => {
  actionDevicesCommon.getActionDevices({
    select: req.query.select,
    actionDeviceIds: req.query[actionDeviceIdsParameterName],
    skip: req.query.skip,
    limit: req.query.limit,
    sort: req.query.sort,
    cursor: req.query.cursor,
    generateCursor: !req.query['cursor-not-generate'],
  }).then(devices => res.json(devices)).catch(next);
};
namespace ApiDoc {
  const sortFields = getSortFields(getAllActionDevicePropertyNames());
  export const apiDoc: OpenAPIV3.OperationObject = {
    description: 'Get action devices',
    tags: ['action-devices'],
    security: [{
      [jwtBearerScheme]: [JwtBearerScope.ADMIN],
    }],
    parameters: [
      {
        $ref: '#/components/parameters/SelectActionDevice',
      },
      {
        in: 'query',
        name: actionDeviceIdsParameterName,
        description: 'Action device IDs to include in result',
        schema: {
          type: 'array',
          items: {
            type: 'integer',
            format: 'int32',
            minimum: 1,
          },
          minItems: 1,
          uniqueItems: true,
        },
      },
      {
        $ref: '#/components/parameters/Skip',
      },
      {
        $ref: '#/components/parameters/Limit',
      },
      {
        $ref: '#/components/parameters/Cursor',
      },
      {
        $ref: '#/components/parameters/CursorNotGenerate',
      },
      {
        in: 'query',
        name: 'sort',
        description: 'Sort orders',
        schema: {
          type: 'array',
          items: {
            type: 'string',
            enum: sortFields,
          },
          minItems: 1,
          maxItems: sortFields.length / 2,
        },
      },
    ],
    responses: {
      200: {
        description: 'Get list of action devices',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                cursor: {
                  $ref: '#/components/schemas/Cursor',
                },
                actionDevices: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/ActionDeviceOptional',
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
    },
  };
}
pathItemHandler.get.apiDoc = ApiDoc.apiDoc;
