"use strict";
const container_1 = require("../../di/container");
const openapi_1 = require("../../utils/openapi");
const bills_common_1 = require("../services/bills.common");
const pathItemHandler = {};
const billsCommon = container_1.getContainer().get(bills_common_1.BillsCommon);
pathItemHandler.get = (req, res, next) => {
    billsCommon.getBills().then(bills => res.json(bills)).catch(next);
};
pathItemHandler.get.apiDoc = {
    description: 'Get bills',
    tags: ['bills'],
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
module.exports = pathItemHandler;
//# sourceMappingURL=bills.js.map