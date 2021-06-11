import { BaseParser } from "chevrotain"
import { GenerateDtsOptions } from "../api"
import { buildModel } from "./model"
import { genDts, GenDtsOptions } from "./generate"

const defaultOptions: GenDtsOptions = {
  includeTypes: true,
  includeVisitorInterface: true,
  visitorInterfaceName: "ICstNodeVisitor"
}

export function generateCstDts(
  parser: BaseParser,
  options?: GenerateDtsOptions
): string {
  const effectiveOptions: GenDtsOptions = {
    ...defaultOptions,
    ...options
  }

  const productions = parser.getGAstProductions()
  const model = buildModel(productions)

  return genDts(model, effectiveOptions)
}
