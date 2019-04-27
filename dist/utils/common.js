"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yaml_1 = require("yaml");
const ts_optchain_1 = require("ts-optchain");
function isPositiveInteger(num) {
    return Number.isSafeInteger(num) && num > 0;
}
exports.isPositiveInteger = isPositiveInteger;
function getUpdatedYamlNodeOrAddNew(document, path, newValue, wrapScalars = true) {
    const existingNode = getYamlNodeAt(document, path);
    if (existingNode) {
        existingNode.value = newValue;
        return existingNode;
    }
    const newNode = yaml_1.createNode(newValue, wrapScalars);
    document.set(path, newNode);
    return newNode;
}
exports.getUpdatedYamlNodeOrAddNew = getUpdatedYamlNodeOrAddNew;
function getYamlNodeAt(document, path) {
    const props = path.split('.');
    let doc = document.contents;
    for (let i = 0, limit = props.length; i < limit; i += 1) {
        if (!doc) {
            return null;
        }
        doc = doc.items
            .find((item) => ts_optchain_1.oc(item.key).value === props[i]);
    }
    return doc;
}
exports.getYamlNodeAt = getYamlNodeAt;
function updateYamlComment(node, comment) {
    node.comment = typeof node.comment === 'string'
        ? `<prepended_comment_from_script>: ${comment}; ${node.comment}`
        : comment;
    return node;
}
exports.updateYamlComment = updateYamlComment;
//# sourceMappingURL=common.js.map