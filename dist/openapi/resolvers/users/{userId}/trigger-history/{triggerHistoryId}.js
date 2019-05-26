"use strict";
const container_1 = require("../../../../../di/container");
const openapi_1 = require("../../../../../utils/openapi");
const user_trigger_history_common_1 = require("../../../../services/user-trigger-history.common");
const pathItemHandler = {};
const userTriggerHistoryCommon = container_1.getContainer().get(user_trigger_history_common_1.UserTriggerHistoryCommon);
const [userIdParamName, userTriggerIdParamName] = openapi_1.getParamNamesFromScriptPath(__filename);
pathItemHandler.parameters = [
    {
        in: 'path',
        name: userIdParamName,
        schema: {
            type: 'integer',
            format: 'int32',
            minimum: 1,
        },
        required: true,
    },
    {
        in: 'path',
        name: userTriggerIdParamName,
        schema: {
            type: 'integer',
            format: 'int32',
            minimum: 1,
        },
        required: true,
    },
];
pathItemHandler.get = (req, res, next) => {
    userTriggerHistoryCommon.getUserTrigger(req.params[userIdParamName], req.params[userTriggerIdParamName])
        .then(userTrigger => res.json(userTrigger))
        .catch(next);
};
pathItemHandler.get.apiDoc = {
    description: 'Get user trigger history item',
    tags: ['user-trigger-history'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        }],
    responses: {
        200: {
            description: 'Return user trigger history item',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/UserTrigger',
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
    userTriggerHistoryCommon.deleteUserTrigger(req.params[userIdParamName], req.params[userTriggerIdParamName])
        .then(userTrigger => res.json(userTrigger))
        .catch(next);
};
pathItemHandler.delete.apiDoc = {
    description: 'Delete user trigger history item',
    tags: ['user-trigger-history'],
    security: [
        {
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        },
    ],
    responses: {
        200: {
            description: 'Return user trigger history item',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/UserTrigger',
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
//# sourceMappingURL={triggerHistoryId}.js.map