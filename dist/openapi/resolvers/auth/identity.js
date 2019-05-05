"use strict";
const openapi_1 = require("../../../utils/openapi");
const container_1 = require("../../../di/container");
const auth_common_1 = require("../../services/auth.common");
const pathItemHandler = {};
const authCommon = container_1.getContainer().get(auth_common_1.AuthCommon);
pathItemHandler.get = (req, res, next) => {
    // This handler does not utilize authCommon because it would be counterintuitive and redundant
    res.json(req.user);
};
pathItemHandler.get.apiDoc = {
    description: 'Get identity of authenticated user',
    security: [{
            [openapi_1.jwtBearerScheme]: [],
        }],
    responses: {
        200: {
            description: 'Login Successful',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/User',
                    },
                },
            },
        },
        401: {
            $ref: '#/components/responses/Unauthenticated',
        },
    },
};
module.exports = pathItemHandler;
//# sourceMappingURL=identity.js.map