import { Rule, GenerateDtsOptions } from "@chevrotain/types"
import { buildModel } from "./model"
import { genDts, GenDtsOptions } from "./generate"

const defaultOptions: GenDtsOptions = {
  includeTypes: true,
  includeVisitorInterface: true,
  visitorInterfaceName: "ICstNodeVisitor"
}

export function generateCstDts(
  productions: Record<string, Rule>,
  options?: GenerateDtsOptions
): string {
  const effectiveOptions: GenDtsOptions = {
    ...defaultOptions,
    ...options
  }

  const model = buildModel(productions)

  return genDts(model, effectiveOptions)
}
