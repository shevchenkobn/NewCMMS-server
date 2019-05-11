import {
  getParamNameFromScriptName,
  IOpenApiPathItemHandler, jwtBearerScheme, JwtBearerScope,
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
      // $ref: '#/components/schemas/Id', // TODO: report a bug
      type: 'integer',
      format: 'int32',
      minimum: 1,
    },
    required: true,
  },
  // {
  //   $ref: '#/components/parameters/SelectUserChange',
  // } as any,
];

pathItemHandler.get = (req, res, next) => {
  usersCommon.getUser(req.params[userIdParamName], req.query.select)
    .then(user => res.json(user))
    .catch(next);
};
pathItemHandler.get.apiDoc = {
  description: 'Get user',
  tags: ['users'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  parameters: [
    {
      $ref: '#/components/parameters/SelectUser',
    },
  ],
  responses: {
    200: {
      description: 'Return user',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/UserOptional',
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

pathItemHandler.delete = (req, res, next) => {
  usersCommon.deleteUser(req.params[userIdParamName], req.query.select)
    .then(user => {
      res.json(user);
    })
    .catch(next);
};
pathItemHandler.delete.apiDoc = {
  description: 'Delete user',
  tags: ['users'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  parameters: [
    {
      $ref: '#/components/parameters/SelectUser',
    },
  ],
  responses: {
    200: {
      description: 'Return user',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/UserOptional',
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
