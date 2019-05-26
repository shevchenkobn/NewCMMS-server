"use strict";
const container_1 = require("../../di/container");
const auth_common_1 = require("../services/auth.common");
const pathItemHandler = {};
const authCommon = container_1.getContainer().get(auth_common_1.AuthCommon);
pathItemHandler.post = (req, res, next) => {
    const credentials = req.body;
    authCommon.getTokensForUser(credentials)
        .then(tokens => res.json(tokens))
        .catch(next);
};
pathItemHandler.post.apiDoc = {
    description: 'Acquire a token pair',
    tags: ['auth'],
    requestBody: {
        description: 'Credentials to log in with',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                        },
                        password: {
                            $ref: '#/components/schemas/UserPassword',
                        },
                    },
                    additionalProperties: false,
                },
            },
        },
        required: true,
    },
    responses: {
        200: {
            description: 'Login Successful',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/TokenPair',
                    },
                },
            },
        },
        400: {
            $ref: '#/components/responses/OpenApiBadRequest',
        },
        401: {
            description: 'Error in login data provided',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/Error',
                    },
                },
            },
        },
    },
};
module.exports = pathItemHandler;
//# sourceMappingURL=auth.js.map