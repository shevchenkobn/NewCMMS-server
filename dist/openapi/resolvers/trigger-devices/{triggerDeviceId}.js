"use strict";
const container_1 = require("../../../di/container");
const openapi_1 = require("../../../utils/openapi");
const trigger_devices_common_1 = require("../../services/trigger-devices.common");
const pathItemHandler = {};
const triggerDevicesCommon = container_1.getContainer().get(trigger_devices_common_1.TriggerDevicesCommon);
const triggerDeviceIdParamName = openapi_1.getParamNameFromScriptName(__filename);
pathItemHandler.parameters = [
    {
        in: 'path',
        name: triggerDeviceIdParamName,
        schema: {
            type: 'integer',
            format: 'int32',
            minimum: 1,
        },
        required: true,
    },
];
pathItemHandler.get = (req, res, next) => {
    triggerDevicesCommon.getTriggerDevice(req.params[triggerDeviceIdParamName], req.query.select)
        .then(device => res.json(device))
        .catch(next);
};
pathItemHandler.get.apiDoc = {
    description: 'Get trigger device',
    tags: ['trigger-devices'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        }],
    parameters: [
        {
            $ref: '#/components/parameters/SelectTriggerDevice',
        },
    ],
    responses: {
        200: {
            description: 'Return trigger device',
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
        404: {
            $ref: '#/components/responses/NotFound',
        },
    },
};
pathItemHandler.delete = (req, res, next) => {
    triggerDevicesCommon.deleteTriggerDevice(req.params[triggerDeviceIdParamName], req.query.select)
        .then(device => res.json(device))
        .catch(next);
};
pathItemHandler.delete.apiDoc = {
    description: 'Delete trigger device',
    tags: ['trigger-devices'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        }],
    parameters: [
        {
            $ref: '#/components/parameters/SelectTriggerDevice',
        },
    ],
    responses: {
        200: {
            description: 'Return trigger device',
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
        404: {
            $ref: '#/components/responses/NotFound',
        },
    },
};
pathItemHandler.patch = (req, res, next) => {
    triggerDevicesCommon.updateTriggerDevice(req.params[triggerDeviceIdParamName], req.body, req.query.select)
        .then(device => res.json(device))
        .catch(next);
};
pathItemHandler.patch.apiDoc = {
    description: 'Update trigger device',
    tags: ['trigger-devices'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        }],
    parameters: [
        {
            $ref: '#/components/parameters/SelectTriggerDevice',
        },
    ],
    requestBody: {
        description: 'A trigger device update',
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/TriggerDeviceUpdate',
                },
            },
        },
        required: true,
    },
    responses: {
        200: {
            description: 'Return trigger device',
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
        404: {
            $ref: '#/components/responses/NotFound',
        },
    },
};
module.exports = pathItemHandler;
//# sourceMappingURL={triggerDeviceId}.js.map