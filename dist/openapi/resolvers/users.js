"use strict";
const container_1 = require("../../di/container");
const openapi_1 = require("../../utils/openapi");
const users_common_1 = require("../services/users.common");
const pathItemHandler = {};
const usersCommon = container_1.getContainer().get(users_common_1.UsersCommon);
pathItemHandler.post = (req, res, next) => {
    const user = req.body;
    const select = req.query.select;
    usersCommon.createUser(user, select).then(user => {
        res.status(201).json(user || {});
    }).catch(next);
};
pathItemHandler.post.apiDoc = {
    description: 'Create user',
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        }],
    requestBody: {
        description: 'A user to create. The password can be generated, omit this field then',
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/UserCreate',
                },
            },
        },
        required: true,
    },
    parameters: [
        {
            $ref: '#/components/parameters/SelectUserChange',
        },
    ],
    responses: {
        200: {
            description: 'Optional user object if select was provided',
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
        403: {
            $ref: '#/components/responses/Forbidden',
        },
    },
};
module.exports = pathItemHandler;
//# sourceMappingURL=users.js.map