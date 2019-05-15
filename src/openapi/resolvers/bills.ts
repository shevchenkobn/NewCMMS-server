import { getContainer } from '../../di/container';
import {
  IOpenApiPathItemHandler,
  jwtBearerScheme,
  JwtBearerScope,
} from '../../utils/openapi';
import { BillsCommon } from '../services/bills.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const billsCommon = getContainer().get<BillsCommon>(BillsCommon);

pathItemHandler.get = (req, res, next) => {
  billsCommon.getBills().then(bills => res.json(bills)).catch(next);
};
pathItemHandler.get.apiDoc = {
  description: 'Get bills',
  tags: ['bills'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  responses: {
    200: {
      description: 'Get list of trigger actions',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              cursor: {
                $ref: '#/components/schemas/Cursor',
              },
              bills: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Bill',
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
