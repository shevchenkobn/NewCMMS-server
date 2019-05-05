import { Optional } from '../../@types';
import { getContainer } from '../../di/container';
import {
  IUserCreate,
  IUserCreateNoPassword,
  IUserWithPassword,
} from '../../models/users.model';
import {
  getAllSafeUserPropertyNames,
  getSortFields,
} from '../../utils/models/users';
import {
  IOpenApiPathItemHandler,
  jwtBearerScheme,
  JwtBearerScope,
} from '../../utils/openapi';
import { UsersCommon } from '../services/users.common';
import { OpenAPIV3 } from 'openapi-types';

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
  tags: ['users'],
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
    201: {
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

const userIdsParameterName = 'user-ids';

pathItemHandler.get = (req, res, next) => {

};
pathItemHandler.get.apiDoc = ApiDoc.apiDoc;
namespace ApiDoc {
  const sortFields = getSortFields();
  export const apiDoc: OpenAPIV3.OperationObject = {
    description: 'Get users',
    tags: ['users'],
    parameters: [
      {
        $ref: '#/components/parameters/SelectUser',
      },
      {
        in: 'query',
        name: userIdsParameterName,
        description: 'User IDs to include in result',
        schema: {
          $ref: '#/components/schemas/id-list.yaml',
        },
      },
      {
        $ref: '#/components/parameters/Skip',
      },
      {
        $ref: '#/components/parameters/Limit',
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
        description: 'Get list of users',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                cursor: {
                  type: 'string',
                },
                users: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/User',
                  },
                },
              },
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
}
