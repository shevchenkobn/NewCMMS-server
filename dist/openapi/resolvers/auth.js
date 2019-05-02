"use strict";
const container_1 = require("../../di/container");
const auth_common_1 = require("../services/auth.common");
const pathItemHandler = {};
const authCommon = container_1.getContainer().get(auth_common_1.AuthCommon);
pathItemHandler.post = async (req, res, next) => {
    res.send({ heldlo: 'asdf' });
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
                        required: ['hello'],
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
};
module.exports = pathItemHandler;
//# sourceMappingURL=auth.js.map