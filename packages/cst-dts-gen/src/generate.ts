import { flatten } from "remeda"
import { isArray } from "remeda"
import { map } from "remeda"
import { uniq } from "remeda"
import { GenerateDtsOptions } from "@chevrotain/types"
import {
  CstNodeTypeDefinition,
  PropertyTypeDefinition,
  PropertyArrayType,
  TokenArrayType,
  RuleArrayType
} from "./model"

export function genDts(
  model: CstNodeTypeDefinition[],
  options: Required<GenerateDtsOptions>
): string {
  let contentParts: string[] = []

  contentParts = contentParts.concat(
    `import type { CstNode, ICstVisitor, IToken } from "chevrotain";`
  )

  contentParts = contentParts.concat(
    flatten(map(model, (node) => genCstNodeTypes(node)))
  )

  if (options.includeVisitorInterface) {
    contentParts = contentParts.concat(
      genVisitor(options.visitorInterfaceName, model)
    )
  }

  return contentParts.join("\n\n") + "\n"
}

function genCstNodeTypes(node: CstNodeTypeDefinition) {
  const nodeCstInterface = genNodeInterface(node)
  const nodeChildrenInterface = genNodeChildrenType(node)

  return [nodeCstInterface, nodeChildrenInterface]
}

function genNodeInterface(node: CstNodeTypeDefinition) {
  const nodeInterfaceName = getNodeInterfaceName(node.name)
  const childrenTypeName = getNodeChildrenTypeName(node.name)

  return `export interface ${nodeInterfaceName} extends CstNode {
  name: "${node.name}";
  children: ${childrenTypeName};
}`
}

function genNodeChildrenType(node: CstNodeTypeDefinition) {
  const typeName = getNodeChildrenTypeName(node.name)

  return `export type ${typeName} = {
  ${map(node.properties, (property) => genChildProperty(property)).join("\n  ")}
};`
}

function genChildProperty(prop: PropertyTypeDefinition) {
  const typeName = buildTypeString(prop.type)
  return `${prop.name}${prop.optional ? "?" : ""}: ${typeName}[];`
}

function genVisitor(name: string, nodes: CstNodeTypeDefinition[]) {
  return `export interface ${name}<IN, OUT> extends ICstVisitor<IN, OUT> {
  ${map(nodes, (node) => genVisitorFunction(node)).join("\n  ")}
}`
}

function genVisitorFunction(node: CstNodeTypeDefinition) {
  const childrenTypeName = getNodeChildrenTypeName(node.name)
  return `${node.name}(children: ${childrenTypeName}, param?: IN): OUT;`
}

function buildTypeString(type: PropertyArrayType) {
  if (isArray(type)) {
    const typeNames = uniq(map(type, (t) => getTypeString(t)))
    const typeString = typeNames.join(" | ")
    return "(" + typeString + ")"
  } else {
    return getTypeString(type)
  }
}

function getTypeString(type: TokenArrayType | RuleArrayType) {
  if (type.kind === "token") {
    return "IToken"
  }
  return getNodeInterfaceName(type.name)
}

function getNodeInterfaceName(ruleName: string) {
  // TODO: document this is a breaking change due to unicode
  return ruleName[0].toUpperCase() + ruleName.substring(1) + "CstNode"
}

function getNodeChildrenTypeName(ruleName: string) {
  return ruleName[0].toUpperCase() + ruleName.substring(1) + "CstChildren"
}
