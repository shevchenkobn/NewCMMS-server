"use strict";
const container_1 = require("../../../../di/container");
const openapi_1 = require("../../../../utils/openapi");
const user_trigger_history_common_1 = require("../../../services/user-trigger-history.common");
const pathItemHandler = {};
const userTriggerHistoryCommon = container_1.getContainer().get(user_trigger_history_common_1.UserTriggerHistoryCommon);
pathItemHandler.get = (req, res, next) => {
    userTriggerHistoryCommon.getUserTriggers(req.user.userId)
        .then(userTrigger => res.json(userTrigger))
        .catch(next);
};
pathItemHandler.get.apiDoc = {
    description: 'Get trigger history for an authenticated identity',
    tags: ['user-trigger-history', 'auth'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.EMPLOYEE],
        }],
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