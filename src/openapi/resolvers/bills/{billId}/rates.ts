import { getContainer } from '../../../../di/container';
import {
  getParamNamesFromScriptPath,
  IOpenApiPathItemHandler, jwtBearerScheme, JwtBearerScope,
} from '../../../../utils/openapi';
import { BillRatesCommon } from '../../../services/bill-rates.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const billRatesCommon = getContainer().get<BillRatesCommon>(BillRatesCommon);

const [billId] = getParamNamesFromScriptPath(__filename);

pathItemHandler.get = (req, res, next) => {
  billRatesCommon.getBillRatesForBill(req.params[billId])
    .then(billRates => res.json(billRates))
    .catch(next);
};
pathItemHandler.get.apiDoc = {
  description: 'Get bill rates',
  tags: ['bill-rates'],
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
              billRates: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/BillRate',
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
