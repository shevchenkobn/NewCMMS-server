// NOTE: Make sure to import it in every entry point you have
import 'reflect-metadata';

export const ASYNC_INIT = Symbol.for('@asyncInit');

export const TYPES = {
  DbConnection: Symbol.for('DbConnection'),

  DbOrchestrator: Symbol.for('DbOrchestrator'),

  AuthService: Symbol.for('AuthService'),

  UsersModel: Symbol.for('UsersModel'),

  AuthController: Symbol.for('AuthController'),
  UsersController: Symbol.for('UsersController'),
};
