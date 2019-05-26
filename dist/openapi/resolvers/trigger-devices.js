"use strict";
const container_1 = require("../../di/container");
const model_1 = require("../../utils/model");
const trigger_devices_1 = require("../../utils/models/trigger-devices");
const openapi_1 = require("../../utils/openapi");
const trigger_devices_common_1 = require("../services/trigger-devices.common");
const pathItemHandler = {};
const triggerDevicesCommon = container_1.getContainer().get(trigger_devices_common_1.TriggerDevicesCommon);
pathItemHandler.post = (req, res, next) => {
    triggerDevicesCommon.createTriggerDevice(req.body, req.query.select).then(device => res.status(201).json(device)).catch(next);
};
pathItemHandler.post.apiDoc = {
    description: 'Create trigger device',
    tags: ['trigger-devices'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        }],
    requestBody: {
        description: 'A trigger device to create',
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/TriggerDeviceCreate',
                },
            },
        },
        required: true,
    },
    parameters: [
        {
            $ref: '#/components/parameters/SelectTriggerDevice',
        },
    ],
    responses: {
        201: {
            description: 'The trigger device was created. Optional object of it',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/TriggerDeviceOptional',
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
const triggerDeviceIdsParameterName = 'trigger-device-ids';
pathItemHandler.get = (req, res, next) => {
    triggerDevicesCommon.getTriggerDevices({
        select: req.query.select,
        triggerDeviceIds: req.query[triggerDeviceIdsParameterName],
        skip: req.query.skip,
        limit: req.query.limit,
        sort: req.query.sort,
        cursor: req.query.cursor,
        generateCursor: !req.query['cursor-not-generate'],
    }).then(devices => res.json(devices)).catch(next);
};
var ApiDoc;
(function (ApiDoc) {
    const sortFields = model_1.getSortFields(trigger_devices_1.getAllTriggerDevicePropertyNames());
    ApiDoc.apiDoc = {
        description: 'Get trigger devices',
        tags: ['trigger-devices'],
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
                $ref: '#/components/parameters/SelectTriggerDevice',
            },
            {
                in: 'query',
                name: triggerDeviceIdsParameterName,
                description: 'Trigger device IDs to include in result',
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
                description: 'Get list of trigger devices',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                cursor: {
                                    $ref: '#/components/schemas/Cursor',
                                },
                                triggerDevices: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/TriggerDeviceOptional',
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
//# sourceMappingURL=trigger-devices.js.map