"use strict";
const container_1 = require("../../../di/container");
const auth_common_1 = require("../../services/auth.common");
const pathItemHandler = {};
const authCommon = container_1.getContainer().get(auth_common_1.AuthCommon);
const includeRefreshTokenParamName = 'include-refresh-token';
pathItemHandler.post = (req, res, next) => {
    const tokenPair = req.body;
    authCommon.getNewAccessToken(tokenPair)
        .then(accessToken => {
        const newTokens = { accessToken };
        const includeRefreshToken = req.query[includeRefreshTokenParamName];
        if (includeRefreshToken) {
            newTokens.refreshToken = tokenPair.refreshToken;
        }
        res.json(newTokens);
    })
        .catch(next);
};
pathItemHandler.post.apiDoc = {
    description: 'Acquire a token pair',
    tags: ['auth'],
    parameters: [
        {
            in: 'query',
            name: includeRefreshTokenParamName,
            description: 'Whether include refresh token in response or not',
            required: false,
            schema: {
                type: 'boolean',
                default: false,
            },
        },
    ],
    requestBody: {
        description: 'Credentials to log in with',
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/TokenPair',
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
                        type: 'object',
                        required: ['accessToken'],
                        properties: {
                            accessToken: {
                                type: 'string',
                            },
                            refreshToken: {
                                type: 'string',
                            },
                        },
                        additionalProperties: false,
                    },
                },
            },
        },
        400: {
            $ref: '#/components/responses/OpenApiBadRequest',
        },
        401: {
            description: 'Error in tokens provided',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/Error',
                    },
                },
            },
        },
        403: {
            $ref: '#/components/responses/Forbidden',
        },
    },
};
module.exports = pathItemHandler;
//# sourceMappingURL=refresh.js.map