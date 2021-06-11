import type { BaseParser } from "chevrotain"

export declare function generateCstDts(
  parser: BaseParser,
  options?: GenerateDtsOptions
): string

export declare type GenerateDtsOptions = {
  includeTypes?: boolean
  includeVisitorInterface?: boolean
  visitorInterfaceName?: string
}
