import {
  getParamNameFromScriptName,
  IOpenApiPathItemHandler, jwtBearerScheme, JwtBearerScope,
} from '../../../utils/openapi';
import { getContainer } from '../../../di/container';
import { UsersCommon } from '../../services/users.common';
import { IRequestWithUser } from '../../../services/security-handlers.service';

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
];

pathItemHandler.get = (req, res, next) => {
  usersCommon.getUser(req.params[userIdParamName], req.query.select)
    .then(user => res.json(user))
    .catch(next);
};
pathItemHandler.get.apiDoc = {
  description: 'Get user',
  tags: ['users'],
  security: [
    {
      [jwtBearerScheme]: [JwtBearerScope.ADMIN],
    },
    {
      [jwtBearerScheme]: [JwtBearerScope.EMPLOYEE],
    },
  ],
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
    404: {
      $ref: '#/components/responses/NotFound',
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
    404: {
      $ref: '#/components/responses/NotFound',
    },
  },
};

pathItemHandler.patch = (req, res, next) => {
  usersCommon.updateUser(
    req.params[userIdParamName],
    req.body,
    req.query.select,
    (req as IRequestWithUser).user,
  )
    .then(user => res.json(user))
    .catch(next);
};
pathItemHandler.patch.apiDoc = {
  description: 'Update user',
  tags: ['users'],
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  parameters: [
    {
      $ref: '#/components/parameters/SelectUserChange',
    },
  ],
  requestBody: {
    description: 'A user update. The password can be generated, put "" then',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/UserUpdate',
        },
      },
    },
    required: true,
  },
  responses: {
    200: {
      description: 'Return user',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/UserWithPassword',
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
