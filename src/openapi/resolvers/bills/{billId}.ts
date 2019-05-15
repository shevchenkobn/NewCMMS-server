import { getContainer } from '../../../di/container';
import {
  getParamNameFromScriptName,
  IOpenApiPathItemHandler, jwtBearerScheme, JwtBearerScope,
} from '../../../utils/openapi';
import { BillsCommon } from '../../services/bills.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const billsCommon = getContainer().get<BillsCommon>(BillsCommon);

const billIdParamName = getParamNameFromScriptName(__filename);

pathItemHandler.parameters = [
  {
    in: 'path',
    name: billIdParamName,
    schema: {
      type: 'integer',
      format: 'int32',
      minimum: 1,
    },
    required: true,
  },
];

pathItemHandler.get = (req, res, next) => {
  billsCommon.getBill(req.params[billIdParamName])
    .then(bill => res.json(bill))
    .catch(next);
};
pathItemHandler.get.apiDoc = {
  description: 'Get bill',
  tags: ['bills'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  responses: {
    200: {
      description: 'Return bill',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Bill',
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
  billsCommon.deleteBill(req.params[billIdParamName])
    .then(bill => res.json(bill))
    .catch(next);
};
pathItemHandler.delete.apiDoc = {
  description: 'Delete bill',
  tags: ['bills'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  responses: {
    200: {
      description: 'Return bill',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Bill',
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
