"use strict";
const openapi_1 = require("../../../utils/openapi");
const container_1 = require("../../../di/container");
const users_common_1 = require("../../services/users.common");
const pathItemHandler = {};
const usersCommon = container_1.getContainer().get(users_common_1.UsersCommon);
pathItemHandler.get = (req, res, next) => {
    // This handler does not utilize authCommon because it would be counterintuitive and redundant
    res.json(req.user);
};
pathItemHandler.get.apiDoc = {
    description: 'Get identity of authenticated user',
    tags: ['auth', 'users'],
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
pathItemHandler.patch = (req, res, next) => {
    const request = req;
    usersCommon.updateUser(request.user.userId, req.body, req.query.select)
        .then(user => res.json(user))
        .catch(next);
};
pathItemHandler.patch.apiDoc = {
    description: 'Update user',
    tags: ['users', 'auth'],
    security: [{
            [openapi_1.jwtBearerScheme]: [],
        }],
    parameters: [
        {
            $ref: '#/components/parameters/SelectUserChange',
        },
    ],
    requestBody: {
        description: 'A user update. The password can be generated, put "" then',
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/UserUpdate',
                },
            },
        },
        required: true,
    },
    responses: {
        200: {
            description: 'Return user',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/UserWithPassword',
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
    },
};
pathItemHandler.delete = (req, res, next) => {
    const request = req;
    usersCommon.deleteUser(request.user.userId, req.query.select)
        .then(user => res.json(user))
        .catch(next);
};
pathItemHandler.delete.apiDoc = {
    description: 'Delete current user account',
    tags: ['users', 'auth'],
    security: [{
            [openapi_1.jwtBearerScheme]: [],
        }],
    parameters: [
        {
            $ref: '#/components/parameters/SelectUser',
        },
    ],
    responses: {
        200: {
            description: 'Return user',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/UserOptional',
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
//# sourceMappingURL=identity.js.map