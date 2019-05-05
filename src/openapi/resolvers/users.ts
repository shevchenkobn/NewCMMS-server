import { Optional } from '../../@types';
import { getContainer } from '../../di/container';
import {
  IUserCreate,
  IUserCreateNoPassword,
  IUserWithPassword,
} from '../../models/users.model';
import {
  IOpenApiPathItemHandler,
  jwtBearerScheme,
  JwtBearerScope,
} from '../../utils/openapi';
import { UsersCommon } from '../services/users.common';

const pathItemHandler: IOpenApiPathItemHandler = {};
export = pathItemHandler;

const usersCommon = getContainer().get<UsersCommon>(UsersCommon);

pathItemHandler.post = (req, res, next) => {
  const user = req.body as
    (IUserCreateNoPassword & { password: Optional<string> });
  const select = req.query.select as (keyof IUserWithPassword)[];
  usersCommon.createUser(user, select).then(user => {
    res.status(201).json(user || {});
  }).catch(next);
};
pathItemHandler.post.apiDoc = {
  description: 'Create user',
  security: [{
    [jwtBearerScheme]: [JwtBearerScope.ADMIN],
  }],
  requestBody: {
    description: 'A user to create. The password can be generated, omit this field then',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/UserCreate',
        },
      },
    },
    required: true,
  },
  parameters: [
    {
      $ref: '#/components/parameters/SelectUserChange',
    },
  ],
  responses: {
    200: {
      description: 'Optional user object if select was provided',
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
  },
};
