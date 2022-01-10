import type { BaseParser } from "chevrotain"

export declare function generateCstDts(
  // TODO: avoid dep on BaseParser, use `Record<string, Rule>` instead
  parser: BaseParser,
  options?: GenerateDtsOptions
): string

export declare type GenerateDtsOptions = {
  includeTypes?: boolean
  includeVisitorInterface?: boolean
  visitorInterfaceName?: string
}
