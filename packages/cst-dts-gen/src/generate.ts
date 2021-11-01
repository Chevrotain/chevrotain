import flatten from "lodash/flatten"
import map from "lodash/map"

import { upperFirst } from "@chevrotain/utils"
import {
  CstNodeTypeDefinition,
  PropertyTypeDefinition,
  PropertyArrayType
} from "./model"

export type GenDtsOptions = {
  includeTypes: boolean
  includeVisitorInterface: boolean
  visitorInterfaceName: string
}

export function genDts(
  model: CstNodeTypeDefinition[],
  options: GenDtsOptions
): string {
  let contentParts: string[] = []

  if (options.includeTypes || options.includeVisitorInterface) {
    contentParts = contentParts.concat(
      `import type { CstNode, ICstVisitor, IToken } from "chevrotain";`
    )
  }

  if (options.includeTypes) {
    contentParts = contentParts.concat(
      flatten(map(model, (node) => genCstNodeTypes(node)))
    )
  }

  if (options.includeVisitorInterface) {
    contentParts = contentParts.concat(
      genVisitor(options.visitorInterfaceName, model)
    )
  }

  return contentParts.length ? contentParts.join("\n\n") + "\n" : ""
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
  const typeName = getTypeString(prop.type)
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

function getTypeString(type: PropertyArrayType) {
  if (type.kind === "token") {
    return "IToken"
  }
  return getNodeInterfaceName(type.name)
}

function getNodeInterfaceName(ruleName: string) {
  return upperFirst(ruleName) + "CstNode"
}

function getNodeChildrenTypeName(ruleName: string) {
  return upperFirst(ruleName) + "CstChildren"
}
