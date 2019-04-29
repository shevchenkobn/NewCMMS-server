import { oc } from 'ts-optchain';
import * as yaml from 'yaml';
import { Nullable } from '../@types';
import AstNode = yaml.ast.AstNode;
import Document = yaml.ast.Document;
import Pair = yaml.ast.Pair;

export function getUpdatedYamlNodeOrAddNew(
  document: Document,
  path: string,
  newValue: any,
  wrapScalars = true,
): AstNode {
  const existingNode = getYamlNodeAt(document, path);
  if (existingNode) {
    (existingNode as any).value = newValue;
    return existingNode;
  }
  const newNode = yaml.createNode(newValue, wrapScalars as true);
  setYamlNodeAt(document, path, newNode as AstNode);
  return newNode as AstNode;
}

export function getYamlValueAt<T>(
  document: Document,
  path: string,
): Nullable<T> {
  const value = oc(getYamlNodeAt(document, path) as any).value;
  return typeof value === 'undefined' ? null : value as unknown as T;
}

export function getYamlNodeAt(
  document: Document,
  path: string,
): Nullable<AstNode> {
  const props = path.split('.');
  let doc = document.contents as any;
  for (let i = 0, limit = props.length; i < limit; i += 1) {
    if (!doc) {
      return null;
    }
    doc = oc(doc.items
      .find((item: Pair) => (oc(item.key) as any).value === props[i])).value;
  }
  return doc as AstNode;
}

export function setYamlNodeAt(
  document: yaml.ast.Document,
  path: string,
  newNode: AstNode,
): Document {
  const props = path.split('.');
  let doc = document.contents as any;
  for (let i = 0, limit = props.length - 1; i < limit; i += 1) {
    if (!doc.has(props[i])) {
      const node = yaml.createNode({}, true);
      doc.set(yaml.createNode(props[i], true), node);
      doc = node;
    } else {
      doc = doc.items
        .find((item: Pair) => (oc(item.key) as any).value === props[i]).value;
    }
  }
  doc.set(props[props.length - 1], newNode);
  return document;
}

export function updateYamlComment(node: AstNode, comment: string) {
  node.comment = typeof node.comment === 'string'
    ? ` <prepended_comment_from_script>: ${comment}; ${node.comment}`
    : ` ${comment}`;
  return node;
}
