"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// NOTE: Make sure to import it in every entry point you have
require("reflect-metadata");
exports.ASYNC_INIT = Symbol.for('@asyncInit');
exports.TYPES = {
    DbConnection: Symbol.for('DbConnection'),
    DbOrchestrator: Symbol.for('DbOrchestrator'),
    AuthService: Symbol.for('AuthService'),
    UsersModel: Symbol.for('UsersModel'),
    AuthController: Symbol.for('AuthController'),
    UsersController: Symbol.for('UsersController'),
};
//# sourceMappingURL=types.js.map