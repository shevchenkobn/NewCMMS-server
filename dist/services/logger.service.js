"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
exports.logger = path.basename(__dirname) !== 'tools'
    ? getNormalLogger()
    : console;
function getNormalLogger() {
    // TODO: change
    return console;
}
//# sourceMappingURL=logger.service.js.map