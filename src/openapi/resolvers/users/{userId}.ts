import {
  getParamNameFromScriptName,
  IOpenApiPathItemHandler,
} from '../../../utils/openapi';
import { getContainer } from '../../../di/container';
import { UsersCommon } from '../../services/users.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const usersCommon = getContainer().get<UsersCommon>(UsersCommon);

const userIdParamName = getParamNameFromScriptName(__filename);

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
