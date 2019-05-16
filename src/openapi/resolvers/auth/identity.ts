import { IRequestWithUser } from '../../../services/security-handlers.service';
import {
  IOpenApiPathItemHandler,
  jwtBearerScheme, JwtBearerScope,
} from '../../../utils/openapi';
import { getContainer } from '../../../di/container';
import { UsersCommon } from '../../services/users.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const usersCommon = getContainer().get<UsersCommon>(UsersCommon);

pathItemHandler.get = (req, res, next) => {
  // This handler does not utilize authCommon because it would be counterintuitive and redundant
  res.json((req as IRequestWithUser).user);
};
pathItemHandler.get.apiDoc = {
  description: 'Get identity of authenticated username',
  tags: ['auth', 'users'],
  security: [{
    [jwtBearerScheme]: [],
  }],
  responses: {
    200: {
      description: 'Login Successful',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/User',
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/Unauthenticated',
    },
  },
};

pathItemHandler.patch = (req, res, next) => {
  const request = req as IRequestWithUser;
  usersCommon.updateUser(request.user.userId, req.body, req.query.select)
    .then(user => res.json(user))
    .catch(next);
};
pathItemHandler.patch.apiDoc = {
  description: 'Update username',
  tags: ['users', 'auth'],
  security: [{
    [jwtBearerScheme]: [],
  }],
  parameters: [
    {
      $ref: '#/components/parameters/SelectUserChange',
    },
  ],
  requestBody: {
    description: 'A username update. The password can be generated, put "" then',
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
      description: 'Return username',
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
  },
};

pathItemHandler.delete = (req, res, next) => {
  const request = req as IRequestWithUser;
  usersCommon.deleteUser(request.user.userId, req.query.select)
    .then(user => res.json(user))
    .catch(next);
};
pathItemHandler.delete.apiDoc = {
  description: 'Delete current username account',
  tags: ['users', 'auth'],
  security: [{
    [jwtBearerScheme]: [],
  }],
  parameters: [
    {
      $ref: '#/components/parameters/SelectUser',
    },
  ],
  responses: {
    200: {
      description: 'Return username',
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
