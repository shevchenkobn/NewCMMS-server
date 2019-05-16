"use strict";
const container_1 = require("../../di/container");
const model_1 = require("../../utils/model");
const users_1 = require("../../utils/models/users");
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
    description: 'Create username',
    tags: ['users'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        }],
    requestBody: {
        description: 'A username to create. The password can be generated, omit this field then',
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
        201: {
            description: 'Optional username object if select was provided',
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
const userIdsParameterName = 'username-ids';
pathItemHandler.get = (req, res, next) => {
    usersCommon.getUsers({
        select: req.query.select,
        userIds: req.query[userIdsParameterName],
        skip: req.query.skip,
        limit: req.query.limit,
        sort: req.query.sort,
        cursor: req.query.cursor,
        generateCursor: !req.query['cursor-not-generate'],
    }).then(users => res.json(users)).catch(next);
};
var ApiDoc;
(function (ApiDoc) {
    const sortFields = model_1.getSortFields(users_1.getAllSafeUserPropertyNames());
    ApiDoc.apiDoc = {
        description: 'Get users',
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
            {
                in: 'query',
                name: userIdsParameterName,
                description: 'User IDs to include in result',
                schema: {
                    type: 'array',
                    items: {
                        type: 'integer',
                        format: 'int32',
                        minimum: 1,
                    },
                    minItems: 1,
                    uniqueItems: true,
                },
            },
            {
                $ref: '#/components/parameters/Skip',
            },
            {
                $ref: '#/components/parameters/Limit',
            },
            {
                $ref: '#/components/parameters/Cursor',
            },
            {
                $ref: '#/components/parameters/CursorNotGenerate',
            },
            {
                in: 'query',
                name: 'sort',
                description: 'Sort orders',
                schema: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: sortFields,
                    },
                    minItems: 1,
                    maxItems: sortFields.length / 2,
                },
            },
        ],
        responses: {
            200: {
                description: 'Get list of users',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                cursor: {
                                    $ref: '#/components/schemas/Cursor',
                                },
                                users: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/UserOptional',
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
})(ApiDoc || (ApiDoc = {}));
pathItemHandler.get.apiDoc = ApiDoc.apiDoc;
module.exports = pathItemHandler;
//# sourceMappingURL=users.js.map