"use strict";
const container_1 = require("../../di/container");
const openapi_1 = require("../../utils/openapi");
const action_devices_common_1 = require("../services/action-devices.common");
const pathItemHandler = {};
const actionDevicesCommon = container_1.getContainer().get(action_devices_common_1.ActionDevicesCommon);
pathItemHandler.post = (req, res, next) => {
    actionDevicesCommon.createActionDevice(req.body, req.query.select).then(device => res.status(201).json(device)).catch(next);
};
pathItemHandler.post.apiDoc = {
    description: 'Create action device',
    tags: ['trigger-devices'],
    security: [{
            [openapi_1.jwtBearerScheme]: [openapi_1.JwtBearerScope.ADMIN],
        }],
    requestBody: {
        description: 'An action device to create',
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/ActionDeviceCreate',
                },
            },
        },
        required: true,
    },
    parameters: [
        {
            $ref: '#/components/parameters/SelectActionDevice',
        },
    ],
    responses: {
        201: {
            description: 'The action device was created. Optional object of it',
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
    },
};
const actionDeviceIdsParameterName = 'action-device-ids';
module.exports = pathItemHandler;
//# sourceMappingURL=action-devices.js.map