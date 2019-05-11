import { Optional } from '../../@types';
import { getContainer } from '../../di/container';
import {
  IUserCreate,
  IUserChangeNoPassword,
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
    (IUserChangeNoPassword & { password: Optional<string> });
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
  usersCommon.getUsers({
    select: req.query.select,
    userIds: req.query[userIdsParameterName],
    skip: req.query.skip,
    limit: req.query.limit,
    sort: req.query.sort,
    cursor: req.query.cursor,
    generateCursor: !req.query['cursor-not-generate'],
  }).then(users => res.json(users)).catch(next);
};
namespace ApiDoc {
  const sortFields = getSortFields();
  export const apiDoc: OpenAPIV3.OperationObject = {
    description: 'Get users',
    tags: ['users'],
    security: [{
      [jwtBearerScheme]: [JwtBearerScope.ADMIN],
    }],
    parameters: [
      {
        $ref: '#/components/parameters/SelectUser',
      },
      {
        in: 'query',
        name: userIdsParameterName,
        description: 'User IDs to include in result',
        schema: { // TODO: Report a bug: cannot reuse here
          type: 'array',
          items: { // TODO: Report a bug: cannot reuse here
            type: 'integer',
            format: 'int32',
            minimum: 1,
          },
          minItems: 1,
          uniqueItems: true,
        },
      },
      {
        $ref: '#/components/parameters/Skip',
      },
      {
        $ref: '#/components/parameters/Limit',
      },
      {
        $ref: '#/components/parameters/Cursor',
      },
      {
        $ref: '#/components/parameters/CursorNotGenerate',
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
                  nullable: true,
                },
                users: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/UserOptional',
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
pathItemHandler.get.apiDoc = ApiDoc.apiDoc;
