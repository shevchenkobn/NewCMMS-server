"use strict";
const container_1 = require("../../di/container");
const model_1 = require("../../utils/model");
const trigger_actions_1 = require("../../utils/models/trigger-actions");
const openapi_1 = require("../../utils/openapi");
const trigger_actions_common_1 = require("../services/trigger-actions.common");
const pathItemHandler = {};
const triggerActionsCommon = container_1.getContainer().get(trigger_actions_common_1.TriggerActionsCommon);
pathItemHandler.post = (req, res, next) => {
    triggerActionsCommon.createTriggerAction(req.body, req.query.select).then(triggerAction => res.status(201).json(triggerAction)).catch(next);
};
pathItemHandler.post.apiDoc = {
    description: 'Create trigger action',
    tags: ['trigger-actions'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        }],
    requestBody: {
        description: 'An trigger action to create',
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/TriggerActionCreate',
                },
            },
        },
        required: true,
    },
    parameters: [
        {
            $ref: '#/components/parameters/SelectTriggerAction',
        },
    ],
    responses: {
        201: {
            description: 'The trigger action was created. Optional object of it',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/TriggerActionOptional',
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
const triggerActionIdsParameterName = 'trigger-action-ids';
pathItemHandler.get = (req, res, next) => {
    triggerActionsCommon.getTriggerActions({
        select: req.query.select,
        triggerActionIds: req.query[triggerActionIdsParameterName],
        skip: req.query.skip,
        limit: req.query.limit,
        sort: req.query.sort,
        cursor: req.query.cursor,
        generateCursor: !req.query['cursor-not-generate'],
    }).then(triggerActions => res.json(triggerActions)).catch(next);
};
var ApiDoc;
(function (ApiDoc) {
    const sortFields = model_1.getSortFields(trigger_actions_1.getAllTriggerActionPropertyNames());
    ApiDoc.apiDoc = {
        description: 'Get trigger action',
        tags: ['trigger-actions'],
        security: [{
                [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
            }],
        parameters: [
            {
                $ref: '#/components/parameters/SelectTriggerAction',
            },
            {
                in: 'query',
                name: triggerActionIdsParameterName,
                description: 'Trigger action IDs to include in result',
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
                description: 'Get list of trigger actions',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                cursor: {
                                    $ref: '#/components/schemas/Cursor',
                                },
                                triggerActions: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/TriggerActionOptional',
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
//# sourceMappingURL=trigger-actions.js.map