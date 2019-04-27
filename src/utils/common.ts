import * as yaml from 'yaml';
import { ast, createNode } from 'yaml';
import { Nullable } from '../@types';
import { oc } from 'ts-optchain';
import AstNode = ast.AstNode;
import Pair = ast.Pair;

export function isPositiveInteger(num: number) {
  return Number.isSafeInteger(num) && num > 0;
}

export function getUpdatedYamlNodeOrAddNew(
  document: ast.Document,
  path: string,
  newValue: any,
  wrapScalars = true,
): AstNode {
  const existingNode = getYamlNodeAt(document, path);
  if (existingNode) {
    (existingNode as any).value = newValue;
    return existingNode;
  }
  const newNode = createNode(newValue, wrapScalars as true);
  (document as any).set(path, newNode);
  return newNode as AstNode;
}

export function getYamlNodeAt(
  document: ast.Document,
  path: string,
): Nullable<AstNode> {
  const props = path.split('.');
  let doc = document.contents as any;
  for (let i = 0, limit = props.length; i < limit; i += 1) {
    if (!doc) {
      return null;
    }
    doc = doc.items
      .find((item: Pair) => (oc(item.key) as any).value === props[i]);
  }
  return doc as AstNode;
}

export function updateYamlComment(node: yaml.ast.AstNode, comment: string) {
  node.comment = typeof node.comment === 'string'
    ? `<prepended_comment_from_script>: ${comment}; ${node.comment}`
    : comment;
  return node;
}
