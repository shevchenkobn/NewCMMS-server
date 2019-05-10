"use strict";
const openapi_1 = require("../../../utils/openapi");
const container_1 = require("../../../di/container");
const users_common_1 = require("../../services/users.common");
const pathItemHandler = {};
const usersCommon = container_1.getContainer().get(users_common_1.UsersCommon);
const userIdParamName = openapi_1.getParamNameFromScriptName(__filename);
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
];
module.exports = pathItemHandler;
//# sourceMappingURL={userId}.js.map