"use strict";
const container_1 = require("../../../di/container");
const openapi_1 = require("../../../utils/openapi");
const bills_common_1 = require("../../services/bills.common");
const pathItemHandler = {};
const billsCommon = container_1.getContainer().get(bills_common_1.BillsCommon);
const billIdParamName = openapi_1.getParamNameFromScriptName(__filename);
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
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
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
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
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
module.exports = pathItemHandler;
//# sourceMappingURL={billId}.js.map