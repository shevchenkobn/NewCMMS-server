import 'reflect-metadata';

export const ASYNC_INIT = Symbol.for('@asyncInit');

export const TYPES = {
  DbConnection: Symbol.for('DbConnection'),

  DbOrchestrator: Symbol.for('DbOrchestrator'),

  AuthService: Symbol.for('AuthService'),

  UserModel: Symbol.for('UserModel'),

  AuthController: Symbol.for('AuthController'),
  UsersController: Symbol.for('UsersController'),
};
