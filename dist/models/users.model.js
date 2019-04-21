"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inversify_1 = require("inversify");
const db_connection_class_1 = require("../services/db-connection.class");
const bcrypt_1 = require("bcrypt");
const db_orchestrator_service_1 = require("../services/db-orchestrator.service");
var UserRole;
(function (UserRole) {
    UserRole[UserRole["EMPLOYEE"] = 1] = "EMPLOYEE";
    UserRole[UserRole["ADMIN"] = 2] = "ADMIN";
})(UserRole = exports.UserRole || (exports.UserRole = {}));
let UsersModel = class UsersModel {
    constructor(dbConnection) {
        this._dbConnection = dbConnection;
    }
    get table() {
        return this._dbConnection.knex(db_orchestrator_service_1.TableName.USERS);
    }
    async create(user, returning) {
        const { password, ...userSeed } = user;
        if (password) {
            userSeed.passwordHash = await bcrypt_1.hash(password, 13);
        }
        return await this.table.insert(userSeed, returning);
    }
};
UsersModel = tslib_1.__decorate([
    inversify_1.injectable(),
    tslib_1.__param(0, inversify_1.inject(db_connection_class_1.DbConnection)),
    tslib_1.__metadata("design:paramtypes", [db_connection_class_1.DbConnection])
], UsersModel);
exports.UsersModel = UsersModel;
//# sourceMappingURL=users.model.js.map