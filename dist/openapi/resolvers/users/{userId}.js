"use strict";
const openapi_1 = require("../../../utils/openapi");
const container_1 = require("../../../di/container");
const users_common_1 = require("../../services/users.common");
const pathItemHandler = {};
const usersCommon = container_1.getContainer().get(users_common_1.UsersCommon);
const userIdParamName = openapi_1.getParamNameFromScriptName(__filename);
pathItemHandler.parameters = [
    {
        in: 'path',
        name: userIdParamName,
        schema: {
            // $ref: '#/components/schemas/Id', // TODO: report a bug
            type: 'integer',
            format: 'int32',
            minimum: 1,
        },
        required: true,
    },
];
pathItemHandler.get = (req, res, next) => {
    usersCommon.getUser(req.params[userIdParamName], req.query.select)
        .then(user => res.json(user))
        .catch(next);
};
pathItemHandler.get.apiDoc = {
    description: 'Get username',
    tags: ['users'],
    security: [
        {
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        },
        {
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.EMPLOYEE],
        },
    ],
    parameters: [
        {
            $ref: '#/components/parameters/SelectUser',
        },
    ],
    responses: {
        200: {
            description: 'Return username',
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
        404: {
            $ref: '#/components/responses/NotFound',
        },
    },
};
pathItemHandler.delete = (req, res, next) => {
    usersCommon.deleteUser(req.params[userIdParamName], req.query.select)
        .then(user => {
        res.json(user);
    })
        .catch(next);
};
pathItemHandler.delete.apiDoc = {
    description: 'Delete username',
    tags: ['users'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        }],
    parameters: [
        {
            $ref: '#/components/parameters/SelectUser',
        },
    ],
    responses: {
        200: {
            description: 'Return username',
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
        404: {
            $ref: '#/components/responses/NotFound',
        },
    },
};
pathItemHandler.patch = (req, res, next) => {
    usersCommon.updateUser(req.params[userIdParamName], req.body, req.query.select)
        .then(user => res.json(user))
        .catch(next);
};
pathItemHandler.patch.apiDoc = {
    description: 'Update username',
    tags: ['users'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        }],
    parameters: [
        {
            $ref: '#/components/parameters/SelectUserChange',
        },
    ],
    requestBody: {
        description: 'A username update. The password can be generated, put "" then',
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
            description: 'Return username',
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
        404: {
            $ref: '#/components/responses/NotFound',
        },
    },
};
module.exports = pathItemHandler;
//# sourceMappingURL={userId}.js.map