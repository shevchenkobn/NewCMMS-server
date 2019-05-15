"use strict";
const container_1 = require("../../../../di/container");
const openapi_1 = require("../../../../utils/openapi");
const user_trigger_history_common_1 = require("../../../services/user-trigger-history.common");
const pathItemHandler = {};
const userTriggerHistoryCommon = container_1.getContainer().get(user_trigger_history_common_1.UserTriggerHistoryCommon);
const [userIdParamName] = openapi_1.getParamNamesFromScriptPath(__filename);
pathItemHandler.get = (req, res, next) => {
    userTriggerHistoryCommon.getUserTriggers(req.params[userIdParamName])
        .then(userTrigger => res.json(userTrigger))
        .catch(next);
};
pathItemHandler.get.apiDoc = {
    description: 'Get user trigger history',
    tags: ['user-trigger-history'],
    security: [
        {
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.EMPLOYEE],
        },
        {
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        },
    ],
    responses: {
        200: {
            description: 'Get user trigger history',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            cursor: {
                                $ref: '#/components/schemas/Cursor',
                            },
                            userTriggers: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/UserTrigger',
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
        404: {
            $ref: '#/components/responses/NotFound',
        },
    },
};
module.exports = pathItemHandler;
//# sourceMappingURL=trigger-history.js.map