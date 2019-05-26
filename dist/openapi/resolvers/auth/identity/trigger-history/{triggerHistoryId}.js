"use strict";
const container_1 = require("../../../../../di/container");
const openapi_1 = require("../../../../../utils/openapi");
const user_trigger_history_common_1 = require("../../../../services/user-trigger-history.common");
const pathItemHandler = {};
const userTriggerHistoryCommon = container_1.getContainer().get(user_trigger_history_common_1.UserTriggerHistoryCommon);
const userTriggerIdParamName = openapi_1.getParamNameFromScriptName(__filename);
pathItemHandler.parameters = [
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
    userTriggerHistoryCommon.getUserTrigger(req.user.userId, req.params[userTriggerIdParamName])
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
module.exports = pathItemHandler;
//# sourceMappingURL={triggerHistoryId}.js.map