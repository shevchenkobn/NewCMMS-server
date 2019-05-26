"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_orchestrator_1 = require("../db-orchestrator");
var UserTriggerType;
(function (UserTriggerType) {
    UserTriggerType[UserTriggerType["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    UserTriggerType[UserTriggerType["ENTER"] = 1] = "ENTER";
    UserTriggerType[UserTriggerType["LEAVE"] = 2] = "LEAVE";
})(UserTriggerType = exports.UserTriggerType || (exports.UserTriggerType = {}));
function getAllUserTriggerPropertyNames() {
    return [
        db_orchestrator_1.getIdColumn(db_orchestrator_1.TableName.USER_TRIGGER_HISTORY),
        'triggerDeviceId', 'triggerTime', 'triggerType', 'userId',
    ];
}
exports.getAllUserTriggerPropertyNames = getAllUserTriggerPropertyNames;
//# sourceMappingURL=user-trigger-history.js.map