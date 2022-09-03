import { ITokenConfig, TokenType } from "@chevrotain/types"
import { createToken } from "../../src/scan/tokens_public.js"

export function createDeferredTokenBuilder(
  config: ITokenConfig
): () => TokenType {
  let tokenCache: TokenType
  return function createTokenOnDemand(): TokenType {
    if (tokenCache === undefined) {
      tokenCache = createToken(config)
    }
    return tokenCache
  }
}
