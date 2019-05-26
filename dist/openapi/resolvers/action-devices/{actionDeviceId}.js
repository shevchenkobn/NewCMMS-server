"use strict";
const container_1 = require("../../../di/container");
const openapi_1 = require("../../../utils/openapi");
const action_devices_common_1 = require("../../services/action-devices.common");
const pathItemHandler = {};
const actionDevicesCommon = container_1.getContainer().get(action_devices_common_1.ActionDevicesCommon);
const actionDeviceIdParamName = openapi_1.getParamNameFromScriptName(__filename);
pathItemHandler.parameters = [
    {
        in: 'path',
        name: actionDeviceIdParamName,
        schema: {
            type: 'integer',
            format: 'int32',
            minimum: 1,
        },
        required: true,
    },
];
pathItemHandler.get = (req, res, next) => {
    actionDevicesCommon.getActionDevice(req.params[actionDeviceIdParamName], req.query.select)
        .then(device => res.json(device))
        .catch(next);
};
pathItemHandler.get.apiDoc = {
    description: 'Get action device',
    tags: ['action-devices'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        }],
    parameters: [
        {
            $ref: '#/components/parameters/SelectActionDevice',
        },
    ],
    responses: {
        200: {
            description: 'Return action device',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/ActionDeviceOptional',
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
    actionDevicesCommon.deleteActionDevice(req.params[actionDeviceIdParamName], req.query.select)
        .then(device => res.json(device))
        .catch(next);
};
pathItemHandler.delete.apiDoc = {
    description: 'Delete action device',
    tags: ['action-devices'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        }],
    parameters: [
        {
            $ref: '#/components/parameters/SelectActionDevice',
        },
    ],
    responses: {
        200: {
            description: 'Return action device',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/ActionDeviceOptional',
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
    actionDevicesCommon.updateActionDevice(req.params[actionDeviceIdParamName], req.body, req.query.select)
        .then(device => res.json(device))
        .catch(next);
};
pathItemHandler.patch.apiDoc = {
    description: 'Update action device',
    tags: ['action-devices'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        }],
    parameters: [
        {
            $ref: '#/components/parameters/SelectActionDevice',
        },
    ],
    requestBody: {
        description: 'An action device update',
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/ActionDeviceUpdate',
                },
            },
        },
        required: true,
    },
    responses: {
        200: {
            description: 'Return action device',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/ActionDeviceUpdate',
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
//# sourceMappingURL={actionDeviceId}.js.map