"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const ts_optchain_1 = require("ts-optchain");
const yaml = require("yaml");
function getUpdatedYamlNodeOrAddNew(document, path, newValue, wrapScalars = true) {
    const existingNode = getYamlNodeAt(document, path);
    if (existingNode) {
        existingNode.value = newValue;
        return existingNode;
    }
    const newNode = yaml.createNode(newValue, wrapScalars);
    setYamlNodeAt(document, path, newNode);
    return newNode;
}
exports.getUpdatedYamlNodeOrAddNew = getUpdatedYamlNodeOrAddNew;
function getYamlValueAt(document, path) {
    const value = getYamlNodeAt(document, path) != null && getYamlNodeAt(document, path).value != null ? getYamlNodeAt(document, path).value : undefined;
    return typeof value === 'undefined' ? null : value;
}
exports.getYamlValueAt = getYamlValueAt;
function getYamlNodeAt(document, path) {
    const props = path.split('.');
    let doc = document.contents;
    for (let i = 0, limit = props.length; i < limit; i += 1) {
        if (!doc) {
            return null;
        }
        doc = doc.items
            .find((item) => item.key.value === props[i]) != null && doc.items
            .find((item) => item.key.value === props[i]).value != null ? doc.items
            .find((item) => item.key.value === props[i]).value : undefined;
    }
    return doc;
}
exports.getYamlNodeAt = getYamlNodeAt;
function setYamlNodeAt(document, path, newNode) {
    const props = path.split('.');
    let doc = document.contents;
    for (let i = 0, limit = props.length - 1; i < limit; i += 1) {
        if (!doc.has(props[i])) {
            const node = yaml.createNode({}, true);
            doc.set(yaml.createNode(props[i], true), node);
            doc = node;
        }
        else {
            doc = doc.items
                .find((item) => item.key.value === props[i]).value;
        }
    }
    doc.set(props[props.length - 1], newNode);
    return document;
}
exports.setYamlNodeAt = setYamlNodeAt;
function updateYamlComment(node, comment) {
    node.comment = typeof node.comment === 'string'
        ? ` <prepended_comment_from_script>: ${comment}; ${node.comment}`
        : ` ${comment}`;
    return node;
}
exports.updateYamlComment = updateYamlComment;
async function loadConfigAsYamlAst(fileName) {
    return yaml.parseDocument(await fs_1.promises.readFile(fileName, 'utf8'));
}
exports.loadConfigAsYamlAst = loadConfigAsYamlAst;
//# sourceMappingURL=yaml.js.map