"use strict";
const container_1 = require("../../di/container");
const openapi_1 = require("../../utils/openapi");
const auth_common_1 = require("../services/auth.common");
const pathItemHandler = {};
const authCommon = container_1.getContainer().get(auth_common_1.AuthCommon);
pathItemHandler.post = async (req, res, next) => {
    res.json({ hello: 'world' });
};
pathItemHandler.post.apiDoc = {
    description: 'test',
    responses: {
        200: {
            description: 'test',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            hello: {
                                type: 'string',
                            },
                        },
                    },
                },
            },
        },
    },
    security: [{
            [openapi_1.jwtBearerScheme]: [],
        }],
};
module.exports = pathItemHandler;
//# sourceMappingURL=auth.js.map