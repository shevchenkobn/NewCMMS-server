"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const randomatic = require("randomatic");
var UserRole;
(function (UserRole) {
    UserRole[UserRole["EMPLOYEE"] = 1] = "EMPLOYEE";
    UserRole[UserRole["ADMIN"] = 2] = "ADMIN";
})(UserRole = exports.UserRole || (exports.UserRole = {}));
function getUserRoleLimits() {
    return [UserRole.EMPLOYEE, UserRole.ADMIN];
}
exports.getUserRoleLimits = getUserRoleLimits;
exports.maxBcryptStringToHashLength = 72;
exports.bcryptOptimalHashCycles = 13;
function getRandomPassword() {
    return randomatic('aA0!', exports.maxBcryptStringToHashLength);
}
exports.getRandomPassword = getRandomPassword;
function isValidUserUniqueIdentifier(emailOrUserId) {
    return Object.keys(emailOrUserId).length === 1 && ('email' in emailOrUserId
        || 'userId' in emailOrUserId);
}
exports.isValidUserUniqueIdentifier = isValidUserUniqueIdentifier;
function getAllSafeUserPropertyNames() {
    return ['userId', 'email', 'role', 'fullName'];
}
exports.getAllSafeUserPropertyNames = getAllSafeUserPropertyNames;
function getSortFields() {
    return getAllSafeUserPropertyNames()
        .flatMap(p => [`<${p}`, `>${p}`]);
}
exports.getSortFields = getSortFields;
//# sourceMappingURL=users.js.map