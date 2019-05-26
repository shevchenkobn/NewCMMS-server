"use strict";
const container_1 = require("../../../../di/container");
const openapi_1 = require("../../../../utils/openapi");
const bill_rates_common_1 = require("../../../services/bill-rates.common");
const pathItemHandler = {};
const billRatesCommon = container_1.getContainer().get(bill_rates_common_1.BillRatesCommon);
const [billIdParamName] = openapi_1.getParamNamesFromScriptPath(__filename);
pathItemHandler.get = (req, res, next) => {
    billRatesCommon.getBillRatesForBill(req.params[billIdParamName])
        .then(billRates => res.json(billRates))
        .catch(next);
};
pathItemHandler.get.apiDoc = {
    description: 'Get bill rates',
    tags: ['bill-rates'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
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
module.exports = pathItemHandler;
//# sourceMappingURL=rates.js.map